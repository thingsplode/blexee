var MenuService = function () {
    
    var menus = [];

    var modelControl = $.extend($({}), (function (o) {
        o.update = function () {
            o.trigger('modup', menus);
        };
        return o;
    })($({})));

    this.initialize = function () {
        // No Initialization required
        var deferred = $.Deferred();
        deferred.resolve();
        return deferred.promise();
    };

    this.findAll = function () {
        console.log('MenuService :: findAll');
        var deferred = $.Deferred();
        deferred.resolve(menus);
        return deferred.promise();
    };
    
    this.addMenu = function (menuName, description, menuView){
        menu = {'id': '', 'menu_name': '', 'view': '', 'view_name':'', 'description':''};
        menu.id = menus.length;
        menu.menu_name = menuName;
        menu.view = menuView;
        menu.view_name = menuView.getViewName();
        menu.description = description;
        menus.push(menu);
    };
    
    this.getView = function (viewName){
        for (i = 0; i < menus.length; i++) {
            if (menus[i].view_name === viewName) { 
                return menus[i].view;
            }    
        }
    };
}; 