/* global menuSchema, Handlebars */

var ViewRepo = function () {
    this.appContainerView = new GenericView('ContainerView', true, Handlebars.compile($("#app-container-tpl").html()), function (view) {
        return menuSchema;
    });

    this.deviceServicesView = new GenericView('DeviceServicesView', false, Handlebars.compile($("#device-services-tpl").html()), function (view) {
        return '';
    });

    this.connectView = new GenericView('ConnectView', false, Handlebars.compile($("#connect-tpl").html()), function (view) {
        return '';
    });

    this.appListView = new GenericView('AppListView', true, Handlebars.compile($('#app-list-tpl').html()), function (view) {
        return '';
    });

    this.errView = new GenericView('ErrorView', false, Handlebars.compile($('#err-tpl').html()), function (view) {
        return '';
    });
};

