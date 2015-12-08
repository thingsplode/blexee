/* global HomeView, Handlebars, DeviceView, router, cfgSchema, ParcelAction, toastr */
"use strict";

//todo: entering into approximation loop without bluetooth with no error
//once device are found in simulation mode, it will not search for new ones
/**
 * Will be set to true by the Hardware Service if running on real phone
 */

//todo: reset configuration button

var DEVICE_PRESENT = false,
        TRACE = false,
        DEBUG = false;

(function () {
    var currentUseCase = '';
    //todo: background threading in the deffered: https://github.com/kmalakoff/background
    ////or http://www.w3schools.com/html/html5_webworkers.asp webworker
    //todo: nullify and delete objects with references
    var cfgService = new ConfigurationService(cfgSchema),
            modelService = new DataModelService(),
            deviceService = new DeviceService(cfgService, modelService),
            menuService = new MenuService(deviceService, cfgService),
            dispatchService = new DispatcherService(cfgService, modelService),
            boxService = cfgService.getValue('/services/box-service'),
            boxServiceUuid = boxService.uuid,
            parcelStoreUuid = boxService.characteristics['parcel-store'],
            parcelReleaseUuid = boxService.characteristics['parcel-release'],
            parcelStoreLastWrite = {'notificationReceived': true, 'barcode': ''},
    parcelReleaseLastWrite = {'notificationReceived': true, 'barcode': ''};

    toastr.options.newestOnTop = false;
    toastr.options.positionClass = "toast-bottom-full-width";
    toastr.options.preventDuplicates = false;
    toastr.options.showDuration = 300;
    toastr.options.hideDuration = 1000;
    //var slider = new PageSlider($('.page-content'));
    var slider;

    //initialization function
    cfgService.registerTriggerableFunction('consoleReplacement', '/blexee/debugMode', configureConsoleLog);
    cfgService.registerTriggerableFunction('globalDebugSetter', '/blexee/debugMode', function (mode) {
        console.log('Setting global variable DEBUG to: [%s]', mode);
        DEBUG = mode;
    });
    cfgService.registerTriggerableFunction('globalTraceSetter', '/blexee/traceMode', function (mode) {
        console.log('Setting global variable TRACE to: [%s]', mode);
        TRACE = mode;
    });
    //cfgService.reset();
    //cfgService.setValue('/blexee/debugMode', true);
    DEBUG = cfgService.getValue('/blexee/debugMode');
    TRACE = cfgService.getValue('/blexee/traceMode');
    console.log('DEBUG MODE: ' + DEBUG);
    console.log('TRACE MODE: ' + TRACE);
    configureConsoleLog(DEBUG);


    menuService.initialize().done(function () {
        //$('body').html(menuService.appContainerView.render().$el);
        //slider.slidePage(menuService.appContainerView.render().$el);
        //$('.page-content').html(menuService.optionsView.render().$el);
    });
    router.addRoute('', function () {
        $('body').html(menuService.appContainerView.render().$el);
        $('.page-content').html(menuService.optionsView.render().$el);
        componentHandler.upgradeAllRegistered();
    });
//    router.addRoute('start', function () {
//        console.log('View :: OptionsView');
//        //var frame = menuService.appContainerView.render().$el;
//        //frame.find('.page-content').html(menuService.optionsView.render().$el);
//        $('body').html(menuService.appContainerView.render().$el);
//        //if (typeof slider === 'undefined') {
//        //    slider = new PageSlider($('.page-content'));
//        //}
//        //slider.slidePage(menuService.optionsView.render().$el);
//        $('.page-content').html(menuService.optionsView.render().$el);
//    });

    router.addRoute('jump/:view', function (view) {
        console.log('Routing View :: ' + view);
        currentUseCase = view;
        if (view === 'DeviceView' || view === 'LogisticianDemoView' || view === 'CustomerDemoView') {
            try {
                //special handling required
                console.log(":: check if bluetooth is enabled");
                var deviceModel = modelService.getModel();
                if (!deviceService.bluetoothEnabled()) {
                    //if bluetooth is not enabled
                    menuService.errView.setModel(new ErrorMessage('Please enable your bluetooth device', 'Use the device settings to enable the bluetooth connection a retry the app functions.'));
                    $('.page-content').html(menuService.errView.render().$el);
                    componentHandler.upgradeAllRegistered();
                    //slider.slidePage(menuService.errView.render().$el);
                } else if (deviceModel.connected) {
                    //redirect to: #connected/device_id
                    window.location.href = '#connected/' + deviceModel.selectedDevice.id;
                } else {
                    //if not connected yet -> search for devices
                    console.log(":: start searching for devices");
                    deviceService.scanForDevices().done(function (deviceModel) {
                        var deviceUuid = cfgService.getValue('/device/connectable-deviceUuid');
                        if (currentUseCase === 'DeviceView') {
                            menuService.getMenuView('DeviceView').setModel(deviceModel);
                            menuService.getMenuView('DeviceView').render();
                        } else if (currentUseCase === 'LogisticianDemoView' || currentUseCase === 'CustomerDemoView') {
                            if ($.inArray(deviceUuid, deviceModel.devices)) {
                                window.location.href = '#connect/' + deviceUuid;
                            }
                        }
                    });
                    menuService.getMenuView('DeviceView').setModel(deviceModel);
                    $('.page-content').html(menuService.getMenuView('DeviceView').render().$el);
                    componentHandler.upgradeAllRegistered();
                    //slider.slidePage(menuService.getMenuView(view).render().$el);
                }
            } catch (error) {
                console.log('ERROR: ' + error);
                menuService.errView.setModel(new ErrorMessage('Program error', error.toString()));
                //$('.page-content').html(menuService.errView.render().$el);
                $('body').html(menuService.errView.render().$el);
            }
        } else if (view === 'SettingsView') {
            menuService.getMenuView(view).setModel(cfgService.getConfigSchemas());
            $('.page-content').html(menuService.getMenuView(view).render().$el);
            componentHandler.upgradeAllRegistered();
        } else {
            $('.page-content').html(menuService.getMenuView(view).render().$el);
            componentHandler.upgradeAllRegistered();
            //slider.slidePage(menuService.getMenuView(view).render().$el);
        }
    });

    router.addRoute('connect/:deviceId', function (deviceId) {
        console.log('Trying to connect-> ' + deviceId);
        $('.page-content').html(menuService.connectView.render().$el);
        //componentHandler.upgradeAllRegistered();
        //slider.slidePage(menuService.connectView.render().$el);
        menuService.connectView.registerModelControl(modelService.getControl());
        deviceService.approximateAndConnectDevice(deviceId, function () {
            console.log("Successfully connected to device");
            menuService.connectView.unregisterModelControl();
            window.location.href = '#connected';
        }, function (error) {
            menuService.errView.setModel(error);
            $('.page-content').html(menuService.errView.render().$el);
            componentHandler.upgradeAllRegistered();
            //slider.slidePage(menuService.errView.render().$el);
        });
    }, function () {
        //break approximation and stop scanning
        deviceService.breakApproximation();
        menuService.connectView.unregisterModelControl();
    });
    router.addRoute('connected', function () {
        //entry handler
        if (currentUseCase === 'DeviceView') {
            $('body').html(menuService.deviceServicesView.render().$el);
            componentHandler.upgradeAllRegistered();
            menuService.deviceServicesView.registerModelControl(modelService.getControl());
        } else if (currentUseCase === 'LogisticianDemoView') {
            $('body').html(menuService.logisticianDemoView.render().$el);
            componentHandler.upgradeAllRegistered();
            menuService.logisticianDemoView.registerModelControl(modelService.getControl());
            deviceService.startNotification(boxServiceUuid, parcelStoreUuid, function (buffer) {
                var data = new Uint8Array(buffer);
                if (DEBUG) {
                    console.log("Notification received: [%s]", data[0]);
                }
                if (!parcelStoreLastWrite.notificationReceived) {
                    if (data[0] === 0x00) {
                        toastr.success('Barcode: ' + parcelStoreLastWrite.barcode, 'Parcel stored!');
                        dispatchService.sendMessage(new ParcelActionRequest(ParcelAction.STORED, parcelStoreLastWrite.barcode, data[0]));
                    } else if (data[0] === 0x01) {
                        //slots not available
                        toastr.warning('Slots are unavailable.');
                    } else if (data[0] === 0x04 || data[0] === 0x05) {
                        //invalid data or generic failure
                        toastr.error('Unsuccesful: invalid data or generic error [' + data[0] + ']');
                    }
                }
                parcelStoreLastWrite.notificationReceived = true;
                parcelStoreLastWrite.barcode = '';
            }, function (param) {
                //todo: put some failure logic for notification start
                console.log('ERROR :: failed to start notifications: %s', JSON.stringify(param));
            });
        } else if (currentUseCase === 'CustomerDemoView') {
            $('body').html(menuService.customerDemoView.render().$el);
            componentHandler.upgradeAllRegistered();
            menuService.customerDemoView.registerModelControl(modelService.getControl());
        }
        deviceService.requestServices().done(function () {
            //menuService.deviceServicesView.setModel(deviceModel);
            //$('.page-content').html(menuService.deviceServicesView.render().$el);
            //slider.slidePage(menuService.deviceServicesView.render().$el);
        }).fail(function (errMsg) {
            menuService.errView.setModel(errMsg);
            $('.page-content').html(menuService.errView.render().$el);
            componentHandler.upgradeAllRegistered();
            //slider.slidePage(menuService.errView.render().$el);
            menuService.deviceServicesView.unregisterModelControl();
        });
    }, function () {
        //exit handler
        menuService.deviceServicesView.unregisterModelControl();
        if (currentUseCase === 'LogisticianDemoView') {
            deviceService.stopNotification(boxServiceUuid, parcelStoreUuid, function (p) {
                //stop notification succeeded
                if (TRACE) {
                    console.log('Notification successfullt stopped: %s', JSON.stringify(p));
                }
            }, function (p) {
                //stop notification failed
                console.log('ERROR: notification could not be stopped: %s', JSON.stringify(p));
            });
        }
    });

    router.addRoute('disconnect', function () {
        //todo: the disconnect has a slow effect / would be more interesting to redirect first, than disconnect ?? <- to be tested
        deviceService.disconnect().done(function () {
            //success
            console.log('diconnected form BLE device.');
        }).fail(function () {
            //failure
            menuService.errView.setModel(new ErrorMessage('Could not disconnect', 'This is a yet unhandled failure.'));
            $('.page-content').html(menuService.errView.render().$el);
            componentHandler.upgradeAllRegistered();

        });
        window.location.href = '';
    }, function () {
        console.log('...leaving disconnect state;');
    });

    router.addRoute('deliver', function () {
        deviceService.scanBarcode().done(function (result) {
            //todo: cancelling barcode is not working
            //try: http://plugins.telerik.com/cordova/plugin/barcodescanner
            //todo: write barcode to ble address
            if (DEBUG) {
                console.log('Scanned barcode result is [%s]', JSON.stringify(result));
            }
            if (!result.cancelled || result.cancelled === 'false') {
                var barcodeBuffer = new ArrayBuffer(result.text.length),
                        barcodeBufferView = new Uint8Array(barcodeBuffer);
                for (var i = 0; i < result.text.length; ++i) {
                    barcodeBufferView[i] = result.text.charCodeAt(i);
                }
                parcelStoreLastWrite.notificationReceived = false;
                parcelStoreLastWrite.barcode = result.text;
//                $('#deliver-btn').prop('disabled', true);
//                $('#deliver-btn').bind('click', false);
//                componentHandler.upgradeAllRegistered();
                deviceService.writeData(boxServiceUuid, parcelStoreUuid, barcodeBufferView.buffer, function () {
                    //data was succesfully written
                    if (DEBUG) {
                        console.log('Data was successfully written.');
                    }
                }, function () {
                    //data could not be written
                    console.log('ERROR :: Data could not be written.');
                });
            }
            window.location.href = '#connected';
        }).fail(function (errMsg) {
            menuService.errView.setModel(errMsg);
            $('.page-content').html(menuService.errView.render().$el);
            componentHandler.upgradeAllRegistered();
            //slider.slidePage(menuService.errView.render().$el);
            //menuService.deviceServicesView.unregisterModelControl();
        });

    }, function () {
        //leaving state
    });

    router.addRoute('pickup', function () {
        var timerActive = false;

        deviceService.startNotification(boxServiceUuid, parcelReleaseUuid, function (buffer) {
            if (!parcelReleaseLastWrite.notificationReceived) {
                timerActive = false;
                var data = new Uint8Array(buffer);
                if (data[0] === 0x02) {
                    toastr.success('Barcode: ' + parcelReleaseLastWrite.barcode, 'Parcel released!');
                    dispatchService.sendMessage(new ParcelActionRequest(ParcelAction.RELEASED, parcelStoreLastWrite.barcode, data[0]));
                } else if (data[0] === 0x03) {
                    toastr.warning('Parcel not found.');
                } else if (data[0] === 0x04 || data[0] === 0x05) {
                    //invalid data or generic failure
                    toastr.error('Unsuccesful: invalid data or generic error [' + data[0] + ']');
                } else {
                    toastr.warning('Unexpected return code received.', 'Unknown result');
                }
                setTimeout(function () {
                    window.location.href = '#disconnect';
                }, getDisconnectWaitTime());
            }
            parcelReleaseLastWrite.notificationReceived = true;
            parcelReleaseLastWrite.barcode = '';
        }, function (param) {
            //todo: put some failure logic for notification start
            console.log('ERROR :: failed to start notifications: %s', JSON.stringify(param));
        });
        var notification = dispatchService.takeNextNotification();
        //todo: prepare it for other notifications
        if (notification) {
            parcelReleaseLastWrite.notificationReceived = false;
            parcelStoreLastWrite.barcode = notification.barcode;
            //$('#pickup-btn').prop('disabled', true);
            $('#pickup-btn').attr('disabled', true);
            $('#pickup-btn').bind('click', false);
            componentHandler.upgradeAllRegistered();
            deviceService.writeData(boxServiceUuid, parcelReleaseUuid, notification.barcode, function () {
                //data was succesfully written
                if (DEBUG) {
                    console.log('Data was successfully written.');
                }
            }, function () {
                //data could not be written
                console.log('ERROR :: Data could not be written.');
            });
            setTimeout(function () {
                if (timerActive) {
                    console.log('WARNING ::: we have time out with the relase! Disconnecting ... ');
                    window.location.href = '#disconnect';
                }
            }, getDisconnectWaitTime());
        } else {
            toastr.warning('Parcels are not available.', 'Disconnecting');
            setTimeout(function () {
                window.location.href = '#disconnect';
            }, getDisconnectWaitTime());
        }

    });

    router.addRoute('reload/:view', function (view) {
        //little trick to be able to reload parts of the page with the same url. without reloading the complete page (which causes flickering)
        window.location.href = '#jump/' + view;
    });
    console.log("Router :: initialized");
    router.start();

    //Register event listeners
    $(document).ready(function () {
        $(document).on('click', '.ble-characteristic-button', function () {
            //when a gatt-characteristic-attached button is clicked
            characteristicUpdate(this);
        });
        $(document).on('submit', '.characteristic-writer', function (e) {
            e.preventDefault();
            var target = $(e.target);
            var bleService = $(target).attr('data-service');
            var bleCharacteristic = $(target).attr('data-characteristic');
            var values = {};
            var formArray = $(this).serializeArray();
            $.each(formArray, function (index, field) {
                values[field.name] = field.value;
            });
            //when there's no name attribute on the form, use: e.target[0].value
            if (DEBUG) {
                console.log('FORM SUBMITTED: ==> [' + JSON.stringify(values) + '] ' + bleService + ' ' + bleCharacteristic + " ");
            }
            deviceService.writeData(bleService, bleCharacteristic, deviceService.parseHexString(values['write-data']), function () {
                target.remove();
            }, function (err) {
                menuService.errView.setModel(err);
                $('.page-content').html(menuService.errView.render().$el);
                componentHandler.upgradeAllRegistered();
            });
        });
    });

    /**
     * Depending on the type of the characteristic various write, read and/or notify actions can be triggered
     * @param {type} callingElement
     * @returns {undefined}
     */
    function characteristicUpdate(callingElement) {
        //the characteristics button was pressed
        var charData = $.parseJSON($(callingElement).attr('data-characteristic'));
        var descriptionElmName = '#dsc-' + charData.id;
        var flags = charData.flags.split(',');
        console.log('button clicked at [' + descriptionElmName + '] -> flags: [' + flags + ']');
        if (flags.indexOf('Write') > -1) {//todo: the write here is case sensitive
            //has write flag
            var stuff = $('<form class="characteristic-writer" data-service=\"' + charData.serviceUuid + '\" data-characteristic=\"' + charData.charUuid + '\" action=\"\">' +
                    '<div class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label short\">' +
                    '<input name="write-data" class=\"mdl-textfield__input\" type=\"text\" pattern=\"-?[A-Fa-f0-9]*(\.[A-Fa-f0-9]+)?\" size=\"30\" id=\"inp-' + charData.id + '\"/>' +
                    '<label class=\"mdl-textfield__label\" for=\"inp-' + charData.id + '\" >' + charData.descriptor + '</label>' +
                    '<span class=\"mdl-textfield__error\">Input is not a hex!</span>' +
                    '</div>' +
                    '</form>');
            $(descriptionElmName).html(stuff);
            //componentHandler.upgradeElement(stuff[0]);
            componentHandler.upgradeAllRegistered();
            if (flags.indexOf('read') > -1) {
                //has read AND write flag
            }
        } else if (flags.indexOf('notify') > -1) {
            //has notify
        } else {
            //only read
            var cellElementName = '#td-' + charData.id;
            if (cfgService.getValue('/blexee/simuMode')) {
                $(descriptionElmName).append('<br>Test');
            }
        }
    }

    function configureConsoleLog(dbgMode) {
        if (!dbgMode) {
            console.log('WARNING -> Removing console log functionality!');
            console = console || {};
            console.log = function () {
            };
        } else {
            console.log = null;
            console.log;         // null
            delete console.log;
            console.log('ENABLING -> console log functionality!');
        }
    }

    function getDisconnectWaitTime() {
        var dcTime = cfgService.getValue('/device/disconnectWait');
        if (!dcTime) {
            dcTime = 2500;
        }
        return dcTime;
    }
}());
