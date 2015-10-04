/* global HomeView, Handlebars, DeviceView, StatusBar, FastClick */

(function () {
    
    HomeView.prototype.template = Handlebars.compile($("#menu-tpl").html());
    DeviceView.prototype.template = Handlebars.compile($("#device-tpl").html());

    var menuService = new MenuService();

    menuService.initialize().done(function () {
        console.log("MenuService :: initialized");
    });
    
   $('body').html(new HomeView(menuService).render().$el);

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