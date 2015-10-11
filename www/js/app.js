/* global HomeView, Handlebars, DeviceView, StatusBar, FastClick, router, DEBUG_MODE */

DEBUG_MODE = true;
var SIMULATION = true;
var simuData = {
    'bluetooth_enabled': true,
    'devices_available': true,
    'can_connect': true
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
    //var slider = new PageSlider($('body'));

    menuService.initialize().done(function () {
        $('body').html(menuService.appContainerView.render().$el);
    });

    router.addRoute('', function () {
        console.log('View :: OptionsView');
        //slider.slidePage(new HomeView(menuService).render().$el);
        $('.page-content').html(menuService.optionsView.render().$el);
    });

    router.addRoute('jump/:view', function (view) {
        console.log('Routing View :: ' + view);
        if (view === 'DeviceView') {
            //special handling required
            console.log("DeviceView :: start decisions");
            var deviceModel = deviceService.getModel();
            if (!deviceService.bluetoothEnabled()) {
                menuService.errView.setModel(new ErrorMessage('Please enable your bluetooth device', 'Use the device settings to enable the bluetooth connection a retry the app functions.'));
                $('.page-content').html(menuService.errView.render().$el);
            } else if (deviceModel.connected) {
                //redirect to: #connected/device_id
                window.location.href = '#connected/' + deviceModel.selectedDevice.id;
            } else {
                //if not connected yet -> searcg for devices
                console.log("DeviceView :: start searching");
                deviceService.searchDevices().done(function (deviceModel) {
                    menuService.getView(view).setModel(deviceModel);
                    menuService.getView(view).render();
                });
                menuService.getView(view).setModel(deviceModel);
                $('.page-content').html(menuService.getView(view).render().$el);
            }
        } else {
            $('.page-content').html(menuService.getView(view).render().$el);
        }
    });

    router.addRoute('connect/:deviceId', function (deviceId) {
        console.log('Trying to connect-> ' + deviceId);
        $('.page-content').html(menuService.connectView.render().$el);
        menuService.connectView.registerModelControl(deviceService.getModelControl());
        deviceService.approximateAndConnectDevice(deviceId, function () {
            console.log("Successfully connected to device");
            menuService.connectView.unregisterModelControl(deviceService.getModelControl());
            window.location.href = '#connected/' + deviceId;
        }, function (error) {
            menuService.errView.setModel(error);
            $('.page-content').html(menuService.errView.render().$el);
        });
    });

    router.addRoute('connected/:deviceId', function (deviceId) {

    });

    router.addRoute('reload/:view', function (view) {
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