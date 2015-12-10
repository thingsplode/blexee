/* global Handlebars */
/**
 * @returns {MenuService}
 */
var MenuService = function () {

    var menus = [];
    var appContainerView, optionsView, deviceSelectionView, deviceServicesView, connectView, customerDemoView, logisticianDemoView, settingsView, serviceMenuView, errView;

    var modelControl = $.extend($({}), (function (o) {
        o.update = function () {
            o.trigger('modup', menus);
        };
        return o;
    })($({})));

    this.initialize = function () {
        var deferred = $.Deferred();
        var self = this;
        this.appContainerView = new GenericView('ContainerView', true, Handlebars.compile($("#app-container-tpl").html()), function (view) {
            var menus;
            self.findAll().done(function (menuList) {
                menus = menuList;
            });
            return menus;
        });

        this.optionsView = new GenericView('OptionsView', true, Handlebars.compile($("#options-tpl").html()), function (view) {
            var menus;
            self.findAll().done(function (menuList) {
                menus = menuList;
            });
            return menus;
        });

        this.deviceSelectionView = new GenericView('DeviceView', false, Handlebars.compile($("#device-selection-tpl").html()), function (view) {
            return '';
        });
        //deviceDemoView.registerModelControl(deviceService.getModelControl());

        this.deviceServicesView = new GenericView('DeviceServicesView', false, Handlebars.compile($("#device-services-tpl").html()), function (view) {
            return '';
        });

        this.connectView = new GenericView('ConnectView', false, Handlebars.compile($("#connect-tpl").html()), function (view) {
            return '';
        });

        this.customerDemoView = new GenericView('CustomerDemoView', false,  Handlebars.compile($("#customer-tpl").html()), function (view) {
            return '';
        });

        this.logisticianDemoView = new GenericView('LogisticianDemoView', false, Handlebars.compile($('#logistician-tpl').html()), function (view) {
            return '';
        });

        this.settingsView = new GenericView('SettingsView', false, Handlebars.compile($('#settings-tpl').html()), function (view) {
            return '';
        });

        this.serviceMenuView = new GenericView('ServiceMenuView', false, Handlebars.compile($('#not-implemented-tpl').html()), function (view) {
            return '';
        });

        this.errView = new GenericView('ErrorView', false, Handlebars.compile($('#err-tpl').html()), function (view) {
            return '';
        });
        this.addMenu('Device Demo', 'A tool, which provides an insight to the technical details and enables interaction with the technology.', this.deviceSelectionView);
        this.addMenu('Customer Demo', 'Demonstrates the interaction of a customer with the system.', this.customerDemoView);
        this.addMenu('Logistician Demo', 'Demonstrates the interaction of logistician with the system.', this.logisticianDemoView);
        this.addMenu('Service Menu', 'Provides a possible service menu example.', this.serviceMenuView);
        this.addMenu('Settings', 'Various settings', this.settingsView);

        deferred.resolve();
        return deferred.promise();
    };

    this.findAll = function () {
        console.log('MenuService :: findAll');
        var deferred = $.Deferred();
        deferred.resolve(menus);
        return deferred.promise();
    };

    this.addMenu = function (menuName, description, menuView) {
        menu = {'id': '', 'menu_name': '', 'view': '', 'view_name': '', 'description': ''};
        menu.id = menus.length;
        menu.menu_name = menuName;
        menu.view = menuView;
        menu.view_name = menuView.getViewName();
        menu.description = description;
        menus.push(menu);
    };

    /**
     * 
     * @param {type} viewName
     * @returns {GenericView}
     */
    this.getMenuView = function (viewName) {
        for (i = 0; i < menus.length; i++) {
            if (menus[i].view_name === viewName) {
                return menus[i].view;
            }
        }
    };
}; 