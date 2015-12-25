/* global Handlebars */
/**
 * @returns {MenuService}
 */
var MenuService = function () {

    

    var modelControl = $.extend($({}), (function (o) {
        o.update = function () {
            o.trigger('modup', internalMenuSchema);
        };
        return o;
    })($({})));
    /**
     * 
     * @param {menuSchema} menuSchema
     * @returns {unresolved}
     */
    this.initialize = function () {
        var self = this;
        if (internalMenuSchema && internalMenuSchema.systemMenu) {
            internalMenuSchema.systemMenu.forEach(function (menuItem, index, systemMenuArray) {
                menuItem.view = new GenericView(menuItem.id, false, Handlebars.compile($(menuItem.view_template_name).html()), function () {
                });
            });
        }
    };

    this.getMenuSchema = function () {
        return internalMenuSchema;
    };

    this.getApps = function () {
        if (internalMenuSchema) {
            return internalMenuSchema.applications;
        } else {
            throw 'Menu Service is not being properly initialized';
        }
    };

    this.getSystemMenu = function () {
        if (internalMenuSchema) {
            return internalMenuSchema.systemMenu;
        } else {
            throw 'Menu Service is not being properly initialized';
        }
    };
    /**
     * Rteturns the view identified by viewName
     * @param {type} viewName
     * @returns {GenericView}
     */
    this.getSystemMenuView = function (viewName) {
        if (!viewName) {
            throw 'Please specify a viewName';
        }
        if (internalMenuSchema) {
            systemMenuElem = internalMenuSchema.systemMenu.find(function (element, index, array) {
                if (element.id === viewName) {
                    return true;
                } else {
                    return false;
                }
            });
            if (!systemMenuElem) {
                throw 'System menu identified by {' + viewName + '} could not be found';
            }
            return systemMenuElem.view;
        } else {
            throw 'Menu service is not yet initialized';
        }
    };
    
    var internalMenuSchema = {
        'systemMenu': [
            {
                id: 'HomeView',
                on_start_page: false,
                caption: 'Home',
                menu_icon: 'home',
                view_template_name: '#home-menu-tpl',
                description: 'Redirects to the main page'
            },
            {
                "id": "CustomerDemoView",
                on_start_page: true,
                "caption": "Customer Demo",
                "menu_icon": "",
                "view_template_name": "#customer-tpl",
                "description": "Demonstrates the interaction of a customer with the system."
            },
            {
                "id": "LogisticianDemo",
                on_start_page: true,
                "caption": "Logistician Demo",
                "menu_icon": "",
                "view_template_name": "#logistician-tpl",
                "description": "Demonstrates the interaction of logistician with the system."
            },
            {
                "id": "DeviceView",
                on_start_page: true,
                "caption": "Device Demo",
                "menu_icon": "",
                "view_template_name": "#device-selection-tpl",
                "description": "A tool, which provides an insight to the technical details and enables interaction with the technology."
            },
            {
                "id": "SettingsView",
                on_start_page: true,
                "caption": "Settings",
                "menu_icon": "",
                "view_template_name": "#settings-tpl",
                "description": "Various settings"
            }

        ],
        "applications": [
            {
                'id': 'dashboard',
                'caption': 'Dashboard',
                'menu_icon': 'toys',
                'view_template_name': '#dashboard-tpl',
                'description': 'Shows various test dashboard items'
            },
            {
                'id': 'locker',
                'caption': 'Locker',
                'menu_icon': 'apps',
                'view_template_name': '#locker-tpl',
                'description': 'Shows the locker status'
            },
            {
                'id': 'storage',
                'caption': 'Storage',
                'menu_icon': 'sd_storage',
                'view_template_name': '#storage-tpl',
                'description': 'Presents storage information'
            }
        ]
    };
}; 