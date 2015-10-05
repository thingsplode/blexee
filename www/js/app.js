/* global HomeView, Handlebars, DeviceView, StatusBar, FastClick, router */

(function () {

    HomeView.prototype.template = Handlebars.compile($("#menu-tpl").html());
    DeviceView.prototype.template = Handlebars.compile($("#device-tpl").html());
    
    var menuService = new MenuService();
    var deviceService = new DeviceService();
    //var slider = new PageSlider($('.page-content'));
    var slider = new PageSlider($('body'));
    
    menuService.initialize().done(function () {
        router.addRoute('', function () {
            console.log('View :: HomeView');
            slider.slidePage(new HomeView(menuService).render().$el);
        });
        router.addRoute('jump/ServiceMenuView', function(){
            console.log('Called Service Menu View');
            //slider.slidePage(new HomeView(menuService).render().$el);
            $('.page-content').html(new DeviceView(deviceService).render().$el);
        });
        
        router.addRoute('jump/:view', function(view) {
            console.log('View :: '+view);
//            service.findById(parseInt(id)).done(function(employee) {
//                slider.slidePage(new EmployeeView(employee).render().$el);
//            });
        });
        console.log("MenuService :: initialized");
        router.start();
    });

    //$('body').html(new HomeView(menuService).render().$el);


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