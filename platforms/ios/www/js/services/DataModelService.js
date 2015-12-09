/* global TRACE */

function DataModelService() {
    var model = {};

    /**
     * Observable component, which will update the observer with the deviceModelData
     * @type @exp;$@call;extend
     */
    var modelControl = $.extend($({}), (function (o) {
        o.update = function () {
            o.trigger('modup', model);
        };
        return o;
    })($({})));

    this.setModelData = function (variable, value) {
        model[variable] = value;
        if (TRACE) {
            console.log('DATA MODEL :: augmented to: %s', JSON.stringify(model));
        }
    };

    this.pushIntoModelArray = function (arrayVariable, arrayElem) {
        model[arrayVariable].push(arrayElem);
    };

    this.getModelData = function (property) {
        return model[property];
    };

    /**
     * Returns a reference to the model control, which will update the view with the device model:
     * { bluetooth: boolean, searching: boolean, connecting: boolean, requestingServices: boolean, connected: boolean, selectedDevice: deviceID, devices: [], services:[]}
     * @returns {Object|mdlControle.modelControl}
     */
    this.getControl = function () {
        return modelControl;
    };
    this.getModel = function () {
        return model;
    };

}

