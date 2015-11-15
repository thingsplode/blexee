/* global HomeView, Handlebars, DeviceView, router */
"use strict";
/**
 * Will be set to true by the Hardware Service if running on real phone
 */
var DEVICE_PRESENT = false;

(function () {
    var cfgSchema = [
        {
            "path": "/blexee",
            "caption": "General Config",
            "keys": [
                {
                    "id": "simuMode",
                    "caption": "Simulation",
                    "type": "Boolean",
                    "valueset": ["Simulation", "Real"],
                    "value": true
                },
                {
                    "id": "debugMode",
                    "caption": "Debug Mode",
                    "type": "Boolean",
                    "value": false
                },
                {
                    "id": "traceMode",
                    "caption": "Trace Mode",
                    "type": "Boolean",
                    "value": false
                },
                {
                    "id": "connectLimit",
                    "caption": "Connect Limit",
                    "type": "Numeric",
                    "value": "-51"
                }
            ]
        }
    ],
            blexeeServices = [
                {"id": "logistician", "uuid": "833e65ce-4e2a-4b56-89a3-d7ba9aefa820", "characteristics": [{"deliver": "1a00"},{"pickup":"1a01"}]},
                {"id": "customer", "uuid": "91dd5587-075d-4db1-8004-a4ab255735ce", "characteristics": [{deliver: "2a00"},{"pickup":"2a01"}]}
            ],
            deviceUuid = '291C9A2E-CCA3-1EF0-5C5C-E19E29973F16',
            currentUseCase = '';

    //todo: nullify and delete objects with references
    var cfgService = new ConfigurationService(cfgSchema);
    //cfgService.reset();
    var deviceService = new DeviceService(cfgService);
    var menuService = new MenuService(deviceService, cfgService);
    //var slider = new PageSlider($('.page-content'));
    var slider;

    //initialization function
    cfgService.registerTriggerableFunction('consoleReplacement', '/blexee/debugMode', configureConsoleLog);
    cfgService.setValue('/blexee/debugMode', true);
    var dbgMode = cfgService.getValue('/blexee/debugMode');
    console.log('DEBUG MODE: ' + dbgMode);
    configureConsoleLog(dbgMode);


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
        if (view === 'DeviceView' || view === 'LogisticianDemoView') {
            try {
                //special handling required
                console.log(":: check if bluetooth is enabled");
                var deviceModel = deviceService.getDeviceModel();
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
                    //if not connected yet -> searcg for devices
                    console.log(":: start searching for devices");
                    deviceService.scanForDevices().done(function (deviceModel) {
                        if (currentUseCase === 'DeviceView') {
                            menuService.getMenuView('DeviceView').setModel(deviceModel);
                            menuService.getMenuView('DeviceView').render();
                        } else if (currentUseCase === 'LogisticianDemoView') {
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
        menuService.connectView.registerModelControl(deviceService.getModelControl());
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
        //todo: break approximation
        //todo: stop scanning
        menuService.connectView.unregisterModelControl();
    });
    router.addRoute('connected', function () {
        //entry handler
        if (currentUseCase === 'DeviceView') {
            $('body').html(menuService.deviceServicesView.render().$el);
            componentHandler.upgradeAllRegistered();
            menuService.deviceServicesView.registerModelControl(deviceService.getModelControl());
        } else if (currentUseCase === 'LogisticianDemoView') {
            $('body').html(menuService.logisticianDemoView.render().$el);
            componentHandler.upgradeAllRegistered();
            menuService.logisticianDemoView.registerModelControl(deviceService.getModelControl());
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
    });

    router.addRoute('disconnect', function () {
        //todo: the disconnect has a slow effect / would be more interesting to redirect first, than disconnect
        deviceService.disconnect(function () {
            //success
        }, function () {
            //failure
            menuService.errView.setModel(new ErrorMessage('Could not disconnect', 'This is a yet unhandled failure.'));
            $('.page-content').html(menuService.errView.render().$el);
            componentHandler.upgradeAllRegistered();

        });
        window.location.href = '';
    });

    router.addRoute('deliver', function () {
        deviceService.scanBarcode().done(function (result) {
            //todo: cancelling barcode is not working
            window.location.href = '#connected';
        }).fail(function (errMsg) {
            menuService.errView.setModel(errMsg);
            $('.page-content').html(menuService.errView.render().$el);
            componentHandler.upgradeAllRegistered();
            //slider.slidePage(menuService.errView.render().$el);
            //menuService.deviceServicesView.unregisterModelControl();
        });

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
            console.log('FORM SUBMITTED: ==> [' + JSON.stringify(values) + '] ' + bleService + ' ' + bleCharacteristic + " ");
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
}());
