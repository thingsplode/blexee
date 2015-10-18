var HomeView = function (menuService) {
    var menus;

    this.initialize = function () {
        console.log('HomeView :: initialzing');
        this.$el = $('<div/>');
        //deviceView = new DeviceView();
        menuService.findAll().done(function (menuList) {
            menus = menuList;
        });
        this.render();
        console.log('HomeView :: initialized');
    };

    this.render = function () {
        console.log('HomeView :: rendering');
        this.$el.html(this.template(menus));
        return this;
    };
    
    this.initialize();
};