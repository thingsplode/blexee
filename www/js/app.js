/* global HomeView, Handlebars, DeviceView, router, cfgSchema, ParcelAction, toastr, menuSchema */
"use strict";

//todo: entering into approximation loop without bluetooth with no error
//once device are found in simulation mode, it will not search for new ones
/**
 * Will be set to true by the Hardware Service if running on real phone
 */

//todo: reset configuration button
//todo: reset the scripts from the body

var DEVICE_PRESENT = false,
        TRACE = false,
        DEBUG = false,
        slider = new PageSlider($('#root'));

var App = function () {
    console.log('Initializing Blexee App');
    var oldConsoleHandler;
    //todo: background threading in the deffered: https://github.com/kmalakoff/background
    ////or http://www.w3schools.com/html/html5_webworkers.asp webworker
    //todo: nullify and delete objects with references
    var cfgService = new ConfigurationService(),
            modelService = new DataModelService(),
            deviceService = new DeviceService(cfgService, modelService),
            menuService = new MenuService(deviceService, cfgService),
            dispatchService = new DispatcherService(cfgService, modelService),
            views = new ViewRepo(menuService),
            boxService = cfgService.getValue('/services/box-service'),
            boxServiceUuid = boxService.uuid,
            parcelStoreUuid = boxService.characteristics['parcel-store'],
            parcelReleaseUuid = boxService.characteristics['parcel-release'],
            systemService = cfgService.getValue('/services/system-service'),
            systemServiceUuid = systemService.uuid,
            cpuPercChar = systemService.characteristics['cpu-percentage'],
            memoryPercChar = systemService.characteristics['memory-percentage'],
            dashboardModelService = new DataModelService(),
            parcelStoreLastWrite = {'notificationReceived': true, 'barcode': ''},
    parcelReleaseLastWrite = {'notificationReceived': true, 'barcode': ''};

    modelService.setModelData('currentUseCase', '');

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
    //
    //cfgService.setValue('/blexee/debugMode', true);
    DEBUG = cfgService.getValue('/blexee/debugMode');
    TRACE = cfgService.getValue('/blexee/traceMode');
    console.log('DEBUG MODE: ' + DEBUG);
    console.log('TRACE MODE: ' + TRACE);
    configureConsoleLog(DEBUG);


    menuService.initialize();

    router.addRoute('', function () {
        //views.appContainerView.displayIn('#root');
        ///views.appContainerView.slideIn('#root');
        views.appContainerView.slideIn();
        menuService.getSystemMenuView('HomeView').setModel(menuService.getSystemMenu());
        menuService.getSystemMenuView('HomeView').display();
    });

    router.addRoute('jump/:menuId', function (menuId) {
        console.log('Routing View :: ' + menuId);
        modelService.setModelData('currentUseCase', menuId);
        if (menuId === 'HomeView') {
            window.location.href = '#';
        } else if (menuId === 'DeviceView' ||
                menuId === 'LogisticianDemo' ||
                menuId === 'CustomerDemoView') {
            try {
                //special handling required
                views.deviceModalView.slideIn();
                var deviceModel = modelService.getModel();
                if (TRACE) {
                    console.log(":: check if bluetooth is enabled");
                }
                deviceService.bluetoothEnabled().done(function (bEnabled) {
                    if (!bEnabled) {
                        //if bluetooth is not enabled
                        views.errView.setModel(new ErrorMessage('Please enable your bluetooth device', 'Use the device settings to enable the bluetooth connection a retry the app functions.'));
                        views.errView.display();
                        //componentHandler.upgradeAllRegistered();
                        //slider.slidePage(menuService.errView.render().$el);
                    } else if (bEnabled && deviceModel.connected) {
                        //redirect to: #connected/device_id
                        window.location.href = '#connected/' + deviceModel.selectedDevice.id;
                    } else {
                        //if not connected yet -> search for devices
                        if (TRACE) {
                            console.log(":: start searching for devices");
                        }
                        deviceService.scanForDevices().done(function (deviceModel) {
                            var deviceUuid = cfgService.getValue('/device/connectable-deviceUuid');
                            if (modelService.getModelData('currentUseCase') === 'DeviceView') {
                                menuService.getSystemMenuView('DeviceView').setModel(deviceModel);
                                menuService.getSystemMenuView('DeviceView').display();
                            } else if (modelService.getModelData('currentUseCase') === 'LogisticianDemo' ||
                                    modelService.getModelData('currentUseCase') === 'CustomerDemoView') {
                                if (deviceService.isDeviceAvailable(deviceUuid)) {
                                    //device found
                                    if (TRACE) {
                                        console.log('ble device identified by uuid %s is available;', deviceUuid);
                                    }
                                    window.location.href = '#connect/' + deviceUuid;
                                } else {
                                    //device not found
                                    if (TRACE) {
                                        console.log('ble device identified by uuid %s is not available;', deviceUuid);
                                    }
                                    menuService.getSystemMenuView('DeviceView').setModel(deviceModel);
                                    menuService.getSystemMenuView('DeviceView').display();
                                }
                            }
                        });
                        menuService.getSystemMenuView('DeviceView').setModel(deviceModel);
                        menuService.getSystemMenuView('DeviceView').display();
                        //slider.slidePage(menuService.getSystemMenuView(view).render().$el);
                    }
                    ;
                });
            } catch (error) {
                console.log('ERROR in jump/:view : %s' + error);
                views.errView.setModel(new ErrorMessage('Program error', error.toString()));
                //$('body').html(menuService.errView.render().$el);
                views.errView.slideIn();
            }
        } else if (menuId === 'SettingsView') {
            menuService.getSystemMenuView(menuId).setModel(cfgService.getConfigSchemas());
            menuService.getSystemMenuView(menuId).display();
        } else {
            menuService.getSystemMenuView(menuId).display();
        }
    });

    router.addRoute('connect/:deviceId', function (deviceId) {
        if (TRACE) {
            console.log('Trying to connect-> ' + deviceId);
        }
        views.connectView.display();
        //slider.slidePage(menuService.connectView.render().$el);
        views.connectView.registerModelControl(modelService.getControl());
        deviceService.approximateAndConnectDevice(deviceId, function () {
            console.log("Successfully connected to device [%s]", deviceId);
            views.connectView.unregisterModelControl();
            window.location.href = '#connected';
        }, function (error) {
            views.errView.setModel(error);
            views.errView.display();
        });
    }, function () {
        //break approximation and stop scanning
        if (DEBUG) {
            console.log('leaving connected state at use case: {%s}', modelService.getModelData('currentUseCase'));
        }
        deviceService.breakApproximation();
        views.connectView.unregisterModelControl();
    });

    router.addRoute('connected', function () {
        //entry handler
        if (modelService.getModelData('currentUseCase') === 'DeviceView') {
            views.deviceModalView.setModel(modelService.getModel());
            views.deviceModalView.render();
            views.bleServicesView.resetModel();//workaround for being set the model by somebody else
            views.bleServicesView.display(modelService.getModel());
            views.bleServicesView.registerModelControl(modelService.getControl());
        } else if (modelService.getModelData('currentUseCase') === 'LogisticianDemo') {
            //menuService.getSystemMenuView('LogisticianDemo').displayIn('#root');
            modelService.setModelData('tabs', [{'caption': 'Delivery', 'active': 'is-active', 'link': 'delivery'}, {'caption': 'Service Menu', 'active': '', 'link': 'service_menu'}]);
            modelService.setModelData('apps', menuService.getApps());

            views.deviceModalView.setModel(modelService.getModel());
            views.deviceModalView.render();
            menuService.getSystemMenuView('LogisticianDemo').display(modelService.getModel(), false);

            deviceService.startNotification(boxServiceUuid, parcelStoreUuid, function (buffer) {
                var data = new Uint8Array(buffer);
                if (DEBUG) {
                    console.log("Notification received: [%s]", data[0]);
                }
                if (!parcelStoreLastWrite.notificationReceived) {
                    if (data[0] === 0x00) {
                        //views
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
        } else if (modelService.getModelData('currentUseCase') === 'CustomerDemoView') {
            window.location.href = '#pickup';
        }

        if (modelService.getModelData('currentUseCase') !== 'CustomerDemoView') {
            //todo: this block is only needed above at the end of DeviceView, only some screen rendering trick requires it for the Logistician as well
            deviceService.requestServices().done(function () {
                //menuService.deviceModalView.setModel(deviceModel);
                //$('.page-content').html(menuService.deviceModalView.render().$el);
                //slider.slidePage(menuService.deviceModalView.render().$el);
            }).fail(function (errMsg) {
                views.errView.setModel(errMsg);
                views.errView.display();
                views.deviceModalView.unregisterModelControl();
            });
        }
    }, function () {
        //exit handler
        if (DEBUG) {
            console.log('leaving connected state at use case: {%s}', modelService.getModelData('currentUseCase'));
        }
        modelService.deleteModelData('tabs');
        views.deviceModalView.resetModel();
        views.deviceModalView.unregisterModelControl();
        menuService.getSystemMenuView('DeviceView').unregisterModelControl();
        menuService.getSystemMenuView('LogisticianDemo').unregisterModelControl();
    });

    router.addRoute('disconnect', function () {
        //todo: the disconnect has a slow effect / would be more interesting to redirect first, than disconnect ?? <- to be tested
        if (modelService.getModelData('currentUseCase') === 'LogisticianDemo') {
            deviceService.stopNotification(boxServiceUuid, parcelStoreUuid, function (p) {
                //stop notification succeeded
                if (TRACE) {
                    console.log('Notification successfullt stopped: %s', JSON.stringify(p));
                }
            }, function (p) {
                //stop notification failed
                console.log('ERROR: notification could not be stopped: %s', JSON.stringify(p));
            });
            //clean up previously possibly saved applist content
            sessionStorage.clear();
        } else if (modelService.getModelData('currentUseCase') === 'CustomerDemoView') {
            deviceService.stopNotification(boxServiceUuid, parcelReleaseUuid, function (p) {
                //stop notification succeeded
                if (TRACE) {
                    console.log('Notification successfullt stopped: %s', JSON.stringify(p));
                }
            }, function (p) {
                //stop notification failed
                console.log('ERROR: notification could not be stopped: %s', JSON.stringify(p));
            });
        }

        deviceService.disconnect().done(function () {
            //success
            deviceService.reset();
            console.log('diconnected form BLE device.');
        }).fail(function () {
            //failure
            views.errView.setModel(new ErrorMessage('Could not disconnect', 'This is a yet unhandled failure.'));
            views.errView.display();

        });
        window.location.href = '#';
    }, function () {
        console.log('leaving disconnect state at use case: {%s}', modelService.getModelData('currentUseCase'));
    });

    router.addRoute('deliver', function () {
        views.deviceModalView.registerModelControl(modelService.getControl());
        deviceService.scanBarcode().done(function (result) {
            //todo: cancelling barcode is not working
            //try: http://plugins.telerik.com/cordova/plugin/barcodescanner
            //todo: write barcode to ble address
            if (DEBUG) {
                console.log('Scanned barcode result is [%s]', JSON.stringify(result));
            }
            if (!result.cancelled || result.cancelled === 'false') {
                parcelStoreLastWrite.notificationReceived = false;
                parcelStoreLastWrite.barcode = result.text;
//                $('#deliver-btn').prop('disabled', true);
//                $('#deliver-btn').bind('click', false);
//                componentHandler.upgradeAllRegistered();
                deviceService.writeData(boxServiceUuid, parcelStoreUuid, prepareBarcodeBuffer(result.text), function () {
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
            views.errView.setModel(errMsg);
            views.errView.display();
        });

    }, function () {
        //leaving state
        views.deviceModalView.unregisterModelControl();
        views.deviceModalView.resetModel();
    });

    router.addRoute('pickup', function () {
        views.deviceModalView.registerModelControl(modelService.getControl());
        var timerActive = true;
        deviceService.startNotification(boxServiceUuid, parcelReleaseUuid, function (buffer) {
            if (!parcelReleaseLastWrite.notificationReceived) {
                timerActive = false;
                var data = new Uint8Array(buffer);
                if (data[0] === 0x02) {
                    toastr.success('Barcode: ' + parcelReleaseLastWrite.barcode, 'Parcel released!');
                    var removedNotification = dispatchService.removeNotification();
                    if (removedNotification.barcode !== parcelReleaseLastWrite.barcode) {
                        console.log("WARNING :: the removed notification barcode [" + removedNotification.barcode + "] is not the same like the last written one [" + parcelReleaseLastWrite.barcode + "].");
                    }
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
        var notification = dispatchService.pollNotification();
        //todo: prepare it for other notifications
        if (notification) {
            parcelReleaseLastWrite.notificationReceived = false;
            parcelStoreLastWrite.barcode = notification.barcode;
            //$('#pickup-btn').prop('disabled', true);
            //$('#pickup-btn').attr('disabled', true);
            //$('#pickup-btn').bind('click', false);
            //componentHandler.upgradeAllRegistered();
            deviceService.writeData(boxServiceUuid, parcelReleaseUuid, prepareBarcodeBuffer(notification.barcode), function () {
                //data was succesfully written
                if (DEBUG) {
                    console.log('Data was successfully written.');
                }
            }, function () {
                //data could not be written
                console.log('ERROR :: Data could not be written.');
                toastr.warning('ERROR...', 'Data could not be written!');
                setTimeout(function () {
                    window.location.href = '#disconnect';
                }, getDisconnectWaitTime());
            });
            
            //TODO: high prio -> why this creates issues w. delivery for customer
            setTimeout(function () {
                if (timerActive) {
                    timerActive = false;
                    toastr.warning('Disconnecting...', 'Release event has timed out!');
                    console.log('WARNING ::: we have time out with the release! Disconnecting ... ');
                    window.location.href = '#disconnect';
                }
            }, getDisconnectWaitTime());
            
        } else {
            toastr.warning('Disconnecting...', 'No available parcel!');
            window.location.href = '#disconnect';
//            setTimeout(function () {
//                window.location.href = '#disconnect';
//            }, getDisconnectWaitTime());
        }

    }, function () {
        //exiting pickup state
        views.deviceModalView.unregisterModelControl();
        views.deviceModalView.resetModel();
    });


    router.addRoute('app/dashboard', function (app) {
        //entry handler
        sessionStorage.serviceMenuSection = $('#service_menu_content').html();
        dashboardModelService.setModelData('cpu', 1);
        dashboardModelService.setModelData('memory', 1);
        dashboardModelService.setModelData('storage', 1);
        views.dashboardView.displayIn('#service_menu_content');
        views.dashboardView.registerModelControl(dashboardModelService.getControl());
        deviceService.startNotification(systemServiceUuid, cpuPercChar, function (buffer) {
            //data received
            
            var data = new Uint8Array(buffer);
            if (DEBUG) {
                console.log("CPU Percentage Notification received, with first byte: [%s]", data[0]);
            }
            dashboardModelService.setModelData('cpu', data[0]);
            dashboardModelService.updateControl();
        }, errorWhileStartingNotification);

        deviceService.startNotification(systemServiceUuid, memoryPercChar, function (buffer) {
            //data received
            var data = new Uint8Array(buffer);
            if (DEBUG) {
                console.log("Memory Percentage Notification received, with first byte: [%s]", data[0]);
            }
            dashboardModelService.setModelData('memory', data[0]);
            dashboardModelService.updateControl();
        }, errorWhileStartingNotification);

    }, function () {
        //exit handler
        views.dashboardView.unregisterModelControl();
        deviceService.stopNotification(systemServiceUuid, cpuPercChar, unsubscribeSucceeded, unsubscribeFailed);
        deviceService.stopNotification(systemServiceUuid, memoryPercChar, unsubscribeSucceeded, unsubscribeFailed);
    });

    function errorWhileStartingNotification() {
        console.log("ERROR: while starting notification.");
    }

    function unsubscribeSucceeded() {
        if (TRACE) {
            console.log("unsubscribe from notification for a bluetooth service/characteristic succeeded");
        }
    }
    function unsubscribeFailed() {
        console.log("ERROR: unsubscribe from notifitcaion for a bluetooth service/characteristic did not succeeded.");
    }

    router.addRoute('reload/:menuId', function (menuId) {
        //little trick to be able to reload parts of the page with the same url. without reloading the complete page (which causes flickering)
        window.location.href = '#jump/' + menuId;
    });
    console.log("Router :: initialized");
    router.start();

    this.reloadSavedApplist = function () {
        $('#service_menu_content').html(sessionStorage.serviceMenuSection);
        window.location.href = '#app/';
    };

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
                views.errView.setModel(err);
                views.errView.display();
            });
        });
    });

    function prepareBarcodeBuffer(barcodeText) {
        var brcLen = barcodeText.length;
        var barcodeBuffer = new ArrayBuffer(brcLen),
                barcodeBufferView = new Uint8Array(barcodeBuffer);
        for (var i = 0; i < brcLen; ++i) {
            barcodeBufferView[i] = barcodeText.charCodeAt(i);
        }
        return barcodeBufferView.buffer;

    }

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
            oldConsoleHandler = console.log;
            console = console || {};
            console.log = function () {
            };
            console.log('DEBUG OVERWRITE due to -> %s', dbgMode);
        } else {
            console.log = null;
            console.log;         // null
            delete console.log;
            if (oldConsoleHandler) {
                console.log = oldConsoleHandler;
            }
            console.log('DEBUG RESTORE due to --> %s', dbgMode);
            console.log('ENABLING -> console log functionality!');
        }
    }

    window.onerror = function (message, url, lineNumber) {
        views.errView.setModel(new ErrorMessage('Generic Error', message));
        views.errView.display();
        console.log("Error: {" + message + "} in {" + url + "} at line [" + lineNumber + "]");
    };

    function getDisconnectWaitTime() {
        var dcTime = cfgService.getValue('/device/disconnectWait');
        if (!dcTime) {
            dcTime = 4000;
        }
        return dcTime;
    }

    this.toggle_drawer = function () {
        var drawer = document.getElementsByClassName('mdl-layout__drawer')[0];
        drawer.classList.toggle("is-visible");
        var layoutObfuscator = document.getElementsByClassName('mdl-layout__obfuscator')[0];
        layoutObfuscator.classList.toggle("is-visible");
    };
};

var app = new App();

