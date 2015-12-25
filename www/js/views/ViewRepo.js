/* global menuSchema, Handlebars */

/**
 * 
 * @param {MenuService} menuService
 * @returns {ViewRepo}
 */
var ViewRepo = function (menuService) {
    this.appContainerView = new GenericView('ContainerView', true, Handlebars.compile($("#app-container-tpl").html()), function (view) {
        return menuService.getMenuSchema();
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

    
    this.dashboardView = new GenericView('DashboardView', false, Handlebars.compile($('#dashboard-tpl').html()), function (view) {
        return '';
    });
};

