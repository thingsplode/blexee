/* global HomeView, Handlebars, DeviceView, StatusBar, FastClick, router, DEBUG_MODE */

(function () {

    DEBUG_MODE = true;
    connected = false;

    if (!DEBUG_MODE) {
        console = console || {};
        console.log = function () {
        };
    }

    var menuService = new MenuService();
    var deviceService = new DeviceService();

    homeView = new GenericView('HomeView', Handlebars.compile($("#menu-tpl").html()), function (view) {
        var menus;
        menuService.findAll().done(function (menuList) {
            menus = menuList;
        });
        return menus;
    });

    deviceView = new GenericView('DeviceView', Handlebars.compile($("#device-tpl").html()), function (view) {
        var devices;
        deviceService.findAll().done(function (deviceList) {
            devices = deviceList;
            view.resetData(deviceList);
            view.render();
        });
        return devices;
    });

    firstMileView = new GenericView('DeviceView', Handlebars.compile($("#not-implemented-tpl").html()), function (view) {
        return '';
    });

    lastMileView = new GenericView('FirstMileView', Handlebars.compile($('#not-implemented-tpl').html()), function (view) {
        return '';
    });

    settingsView = new GenericView('FirstMileView', Handlebars.compile($('#not-implemented-tpl').html()), function (view) {
        return '';
    });

    serviceMenuView = new GenericView('FirstMileView', Handlebars.compile($('#not-implemented-tpl').html()), function (view) {
        return '';
    });

    var viewArray = {
        "DeviceView": deviceView,
        "FirstMileView": firstMileView,
        "LastMileView": lastMileView,
        "SettingsView": settingsView,
        "ServiceMenuView": serviceMenuView};

    //var slider = new PageSlider($('.page-content'));
    //var slider = new PageSlider($('body'));
    $('body').html(homeView.render().$el);

    menuService.initialize().done(function () {
        router.addRoute('', function () {
            console.log('View :: DeviceView');
            //slider.slidePage(new HomeView(menuService).render().$el);
            $('.page-content').html(deviceView.render().$el);
        });

        router.addRoute('jump/:view', function (view) {
            console.log('Routing View :: ' + view);
            $('.page-content').html(viewArray[view].render().$el);
        });

        router.addRoute('connect/:deviceId', function (deviceId) {
            console.log('Trying to connect-> ' + deviceId);
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