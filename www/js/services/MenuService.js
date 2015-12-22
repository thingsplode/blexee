/* global Handlebars */
/**
 * @returns {MenuService}
 */
var MenuService = function () {

    var internalMenuSchema;

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
    this.initialize = function (menuSchema) {
        var self = this;
        if (!menuSchema) {
            throw 'Service cannot be initialized without a schema';
        }
        internalMenuSchema = menuSchema;
        if (menuSchema && menuSchema.systemMenu) {
            menuSchema.systemMenu.forEach(function (menuItem, index, systemMenuArray) {
                menuItem.view = new GenericView(menuItem.id, false, Handlebars.compile($(menuItem.view_template_name).html()), function (){});
            });
        }
    };

    this.getMenuSchema = function () {
        return internalMenuSchema;
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
                throw 'System menu identified by ' + viewName + 'could not be found';
            }
            return systemMenuElem.view;
        } else {
            throw 'Menu service is not yet initialized';
        }
    };
}; 