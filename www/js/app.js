/* global HomeView, Handlebars, DeviceView, StatusBar, FastClick, router, DEBUG_MODE */

DEBUG_MODE = true;
var SIMULATION = true;
var simuData = {
    'bluetooth_enabled': true,
    'devices_available': true
};

(function () {

    if (!DEBUG_MODE) {
        console = console || {};
        console.log = function () {
        };
    }

    var menuService = new MenuService();
    var deviceService = new DeviceService();

    appContainerView = new GenericView('HomeView', Handlebars.compile($("#app-container-tpl").html()), function (view) {
        var menus;
        menuService.findAll().done(function (menuList) {
            menus = menuList;
        });
        return menus;
    });

    deviceDemoView = new GenericView('DeviceView', Handlebars.compile($("#device-demo-tpl").html()), function (view) {
        var devices;
        deviceService.searchDevices().done(function (deviceModel) {
            devices = deviceModel;
            view.setModel(deviceModel);
            view.render();
        });
        return devices;
    });
    deviceDemoView.registerModelControl(deviceService.getModelControl());

    connectView = new GenericView('ConnectView', Handlebars.compile($("#connect-tpl").html()), function (view) {
        return '';
    });
    
    customerDemoView = new GenericView('CustomerDemoView', Handlebars.compile($("#not-implemented-tpl").html()), function (view) {
        return '';
    });

    logisticianDemoView = new GenericView('LogisticianDemoView', Handlebars.compile($('#not-implemented-tpl').html()), function (view) {
        return '';
    });

    settingsView = new GenericView('SettingsView', Handlebars.compile($('#not-implemented-tpl').html()), function (view) {
        return '';
    });

    serviceMenuView = new GenericView('ServiceMenuView', Handlebars.compile($('#not-implemented-tpl').html()), function (view) {
        return '';
    });

    menuService.addMenu('Device Demo', '', deviceDemoView);
    menuService.addMenu('Customer Demo', '', customerDemoView);
    menuService.addMenu('Logistician Demo', '', logisticianDemoView);
    menuService.addMenu('Service Menu', '', serviceMenuView);
    menuService.addMenu('Settings', '', settingsView);

    //var slider = new PageSlider($('.page-content'));
    //var slider = new PageSlider($('body'));
    $('body').html(appContainerView.render().$el);

    menuService.initialize().done(function () {
        router.addRoute('', function () {
            console.log('View :: DeviceView');
            //slider.slidePage(new HomeView(menuService).render().$el);
            deviceDemoView.setModel(deviceService.getModel());
            $('.page-content').html(deviceDemoView.render().$el);
        });

        router.addRoute('jump/:view', function (view) {
            console.log('Routing View :: ' + view);
            $('.page-content').html(menuService.getView(view).render().$el);
        });

        router.addRoute('connect/:deviceId', function (deviceId) {
            console.log('Trying to connect-> ' + deviceId);
            $('.page-content').html(connectView.render().$el);
            connectView.registerModelControl(deviceService.getModelControl());
            deviceService.approximateAndConnectDevice(deviceId, function () {
                console.log("Successfully connected to device");
                connectView.unregisterModelControl(deviceService.getModelControl());
                window.location.href = '#connected/'+deviceId;
            }, function () {
                console.log("!!!!! FAILED to connect to device");
            });
        });
        console.log("MenuService :: initialized");
        router.start();
    });



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