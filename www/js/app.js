/* global HomeView, Handlebars, DeviceView, StatusBar, FastClick, router, DEBUG_MODE */

 var DEBUG_MODE = true;
 var SIMULATION = true;

 var simuData = {
     'bluetooth_enabled': true,
     'devices_available': true,
     'can_connect': true,
     'services_available': true
 };

 function ErrorMessage(title, message) {
     this.title = title;
     this.message = message;
 }

(function () {

    if (!DEBUG_MODE) {
        console = console || {};
        console.log = function () {
        };
    }

    document.addEventListener('deviceready', function () {
        console.log(StatusBar);
        //StatusBar.backgroundColorByHexString('#ffffff');
        //StatusBar.styleDefault();
        //StatusBar.styleBlackTranslucent();
        //StatusBar.backgroundColorByName("red");
        StatusBar.styleLightContent();
        StatusBar.overlaysWebView(false);
        StatusBar.backgroundColorByHexString('#3F51B5');
        FastClick.attach(document.body);

        if (navigator.notification) { // Override default HTML alert with native dialog
            window.alert = function (message) {
                navigator.notification.alert(
                        message, // message
                        null, // callback
                        "Blexee", // title
                        'OK'        // buttonName
                        );
            };
        }
        //alert('device ready');
    }, false);

    var deviceService = new DeviceService();
    var menuService = new MenuService(deviceService);
    //var slider = new PageSlider($('.page-content'));
    var slider;
    menuService.initialize().done(function () {
//$('body').html(menuService.appContainerView.render().$el);
//slider.slidePage(menuService.appContainerView.render().$el);
//$('.page-content').html(menuService.optionsView.render().$el);
    });
    router.addRoute('', function () {
        $('body').html(menuService.appContainerView.render().$el);
        $('.page-content').html(menuService.optionsView.render().$el);
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
        if (view === 'DeviceView') {
            //special handling required
            console.log("DeviceView :: check if bluetooth is enabled");
            var deviceModel = deviceService.getDeviceModel();
            if (!deviceService.bluetoothEnabled()) {
                //if bluetooth is not enabled
                menuService.errView.setModel(new ErrorMessage('Please enable your bluetooth device', 'Use the device settings to enable the bluetooth connection a retry the app functions.'));
                $('.page-content').html(menuService.errView.render().$el);
                //slider.slidePage(menuService.errView.render().$el);
            } else if (deviceModel.connected) {
                //redirect to: #connected/device_id
                window.location.href = '#connected/' + deviceModel.selectedDevice.id;
            } else {
                //if not connected yet -> searcg for devices
                console.log("DeviceView :: start searching");
                deviceService.scanForDevices().done(function (deviceModel) {
                    menuService.getMenuView(view).setModel(deviceModel);
                    menuService.getMenuView(view).render();
                });
                menuService.getMenuView(view).setModel(deviceModel);
                $('.page-content').html(menuService.getMenuView(view).render().$el);
                //slider.slidePage(menuService.getMenuView(view).render().$el);
            }
        } else {
            $('.page-content').html(menuService.getMenuView(view).render().$el);
            //slider.slidePage(menuService.getMenuView(view).render().$el);
        }
    });
    router.addRoute('connect/:deviceId', function (deviceId) {
        console.log('Trying to connect-> ' + deviceId);
        $('.page-content').html(menuService.connectView.render().$el);
        //slider.slidePage(menuService.connectView.render().$el);
        menuService.connectView.registerModelControl(deviceService.getModelControl());
        deviceService.approximateAndConnectDevice(deviceId, function () {
            console.log("Successfully connected to device");
            menuService.connectView.unregisterModelControl();
            window.location.href = '#connected';
        }, function (error) {
            menuService.errView.setModel(error);
            $('.page-content').html(menuService.errView.render().$el);
            //slider.slidePage(menuService.errView.render().$el);
        });
    }, function () {
        menuService.connectView.unregisterModelControl();
    });
    router.addRoute('connected', function () {
        //http://stackoverflow.com/questions/31492069/material-design-lite-inputs-in-ember-js-app-loses-it-design-after-route-transiti
        //https://github.com/google/material-design-lite/tree/master/src/layout/snippets
        //http://stackoverflow.com/questions/32957407/material-design-lite-how-to-programatically-reset-a-floating-label-input-text
        $('body').html(menuService.deviceServicesView.render().$el);
        deviceService.requestServices(function (err) {
            menuService.errView.setModel(err);
            $('.page-content').html(menuService.errView.render().$el);
            //slider.slidePage(menuService.errView.render().$el);
            menuService.deviceServicesView.unregisterModelControl();
        }).done(function (deviceModel) {
            menuService.deviceServicesView.setModel(deviceModel);
            //$('.page-content').html(menuService.deviceServicesView.render().$el);
            //slider.slidePage(menuService.deviceServicesView.render().$el);
            menuService.deviceServicesView.registerModelControl(deviceService.getModelControl());
        });
    }, function () {
        menuService.deviceServicesView.unregisterModelControl();
    });
    router.addRoute('disconnect', function () {
        deviceService.disconnect();
        window.location.href = '';
    });
    router.addRoute('reload/:view', function (view) {
        //little trick to be able to reload parts of the page with the same url. without reloading the complete page (which causes flickering)
        window.location.href = '#jump/' + view;
    });
    console.log("Router :: initialized");
    router.start();
    $(document).ready(function () {
        $(document).on('click', '.ble-characteristic-button', function () {
            var charData = $.parseJSON($(this).attr('data-characteristic'));
            var descriptionElmName = '#dsc-' + charData.id;
            var flags = charData.flags.split(',');
            console.log('button clicked at [' + descriptionElmName + '] -> flags: [' + flags + ']');
            if (flags.indexOf('write') > -1) {
                //has write flag
                $(descriptionElmName).html('<form class="characteristic-writer" data-service=\"' + charData.serviceUuid + '\" data-characteristic=\"' + charData.charUuid + '\" action=\"\">' +
                        '<div class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label short\">' +
                        '<input name="write-data" class=\"mdl-textfield__input\" type=\"text\" pattern=\"-?[A-Fa-f0-9]*(\.[A-Fa-f0-9]+)?\" size=\"30\" id=\"inp-' + charData.id + '\"/>' +
                        '<label class=\"mdl-textfield__label\" for=\"inp-' + charData.id + '\" >' + charData.descriptor + '</label>' +
                        '<span class=\"mdl-textfield__error\">Input is not a hex!</span>' +
                        '</div>' +
                        '</form>');

                $('.characteristic-writer').on('submit', function (e) {
                    e.preventDefault();
                    var target = $(e.target);
                    var bleService = $(this).attr('data-service');
                    var bleCharacteristic = $(this).attr('data-characteristic');
                    var values = {};
                    var formArray = $(this).serializeArray();
                    $.each(formArray, function (index, field) {
                        values[field.name] = field.value;
                    });
                    console.log('FORM SUBMITTED: ==> [' + JSON.stringify(values) + '] ' + bleService + ' ' + bleCharacteristic + " ");
                    //when there's no name attribute on the form, use: e.target[0].value
                    target.remove();
                });
                if (flags.indexOf('read') > -1) {
                    //has read AND write flag
                }
            } else if (flags.indexOf('notify') > -1) {
                //has notify
            } else {
                //only read
                var cellElementName = '#td-' + charData.id;
                if (SIMULATION) {
                    $(descriptionElmName).append('<br>Test');
                }
            }
        });
//        $(document).on('click', function () {
//            console.log('------------------click-------------->');
//        });
    });
}());
