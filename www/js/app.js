/* global HomeView, Handlebars, DeviceView, StatusBar, FastClick, router, DEBUG_MODE */

DEBUG_MODE = true;
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

    var deviceService = new DeviceService();
    var menuService = new MenuService(deviceService);

    //var slider = new PageSlider($('.page-content'));
    var slider;
    menuService.initialize().done(function () {
        $('body').html(menuService.appContainerView.render().$el);
        //slider.slidePage(menuService.appContainerView.render().$el);
        $('.page-content').html(menuService.optionsView.render().$el);
    });

    router.addRoute('', function () {
        //window.location.href = '#start';
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
            window.location.href = '#connected/' + deviceId;
        }, function (error) {
            menuService.errView.setModel(error);
            $('.page-content').html(menuService.errView.render().$el);
            //slider.slidePage(menuService.errView.render().$el);
        });
    }, function () {
        menuService.connectView.unregisterModelControl();
    });

    router.addRoute('connected/:deviceId', function (deviceId) {
        deviceService.requestServices(function (err) {
            menuService.errView.setModel(err);
            $('.page-content').html(menuService.errView.render().$el);
            //slider.slidePage(menuService.errView.render().$el);
            menuService.deviceServicesView.unregisterModelControl();
        }).done(function (deviceModel) {
            menuService.deviceServicesView.setModel(deviceModel);
            //$('.page-content').html(menuService.deviceServicesView.render().$el);
            $('body').html(menuService.deviceServicesView.render().$el);
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

    document.addEventListener('deviceready', function () {
        StatusBar.overlaysWebView(false);
        StatusBar.backgroundColorByHexString('#ffffff');
        StatusBar.styleDefault();
        FastClick.attach(document.body);
        if (navigator.notification) { // Override default HTML alert with native dialog
            window.alert = function (message) {
                navigator.notification.alert(
                        message, // message
                        null, // callback
                        "Workshop", // title
                        'OK'        // buttonName
                        );
            };
        }
    }, false);

}());