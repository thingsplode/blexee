/* global TRACE, DEBUG, slider */
/**
 * 
 * @param {type} viewName the unique name of the view as text
 * @param {Boolean} reusableModel if reusable, the model added once to the view will not be cleaned up upon rendering
 * @param {type} template the id of the handlebar template used for generating the content
 * @param {type} modelProviderFunction the function which generates the model
 * @returns {GenericView}
 */
var GenericView = function (viewName, reusableModel, template, modelProviderFunction) {

    var mdl, modelCtrl, configService;

    this.initialize = function () {
        this.$el = $('<div id="' + viewName + '"/>');
        if (modelProviderFunction) {
            mdl = modelProviderFunction(this);
        }
        if (!mdl) {
            mdl = [];
        }
        mdl["viewId"] = viewName+'Ctx';
        
        this.render(mdl);
        console.log(viewName + ' :: initialized');
    };

    this.registerModelControl = function (modelControl, updateFunction) {
        var view = this;
        modelCtrl = modelControl;
        modelCtrl.on('modup', function (e, data) {
            if (TRACE) {
                console.log(viewName + ' :: Model updated -> [event] ' + JSON.stringify(e) + '[model data] ' + JSON.stringify(data));
            }
            if (DEBUG) {
                console.log(viewName + ' :: Model updated {' + viewName + '} ');
            }
            view.setModel(data);
            view.render();
            if (updateFunction) {
                updateFunction(mdl);
            }
        });
    };

    this.unregisterModelControl = function () {
        if (typeof modelCtrl !== 'undefined') {
            modelCtrl.off();
        }
    };

    /**
     * Extend the current data model with additional variable
     * @param {type} variable
     * @param {type} value
     * @returns {undefined}
     */
    this.addModelData = function (variable, value) {
        mdl[variable] = value;
    };

    this.setModel = function (model) {
        mdl = model;
    };

    this.getViewName = function () {
        return viewName;
    };

    this.resetModel = function () {
        mdl = '';
    };

    /**
     * Renders the view content in a specific dom element
     * @param {type} jquerySelector a dom expression (eg. 'body' or '.myClass' or '#myId'
     * @param {boolean} skipComponentUpgrade if true, the visual components will not be upgraded
     * @returns {undefined}
     */
    this.displayIn = function (jquerySelector, skipComponentUpgrade) {
        $(jquerySelector).html(this.render().$el);
        if (!skipComponentUpgrade) {
            componentHandler.upgradeAllRegistered();
        }
        if (!reusableModel) {
            this.resetModel();
        }
    };

    this.slideIn = function () {
        var page = this.render().$el;
        slider.slidePage(page);
    };

    this.display = function (model) {
        if (model) {
            this.setModel(model);
        }
        
        if ($('.page-content').length > 1){
            this.displayIn('.active');
        } else {
            this.displayIn('.page-content');
        }
        
        //this.displayIn('#'+viewName+'Ctx .page-content');
    };

    this.render = function () {
        try {
            if (TRACE) {
                console.log(viewName + ' :: rendering with [modeldata]--> ' + JSON.stringify(mdl));
            }
            this.$el.html(template(mdl));
        } catch (err) {
            console.log("ERROR: rendering error --> " + JSON.stringify(err));
            //+ '\n' + err ? JSON.stringify(err.stack) : "no stack");
            if (!err) {
                err = 'Unknown.';
            }
            if (this.$el) {
                this.$el.html(err);
            }
        }
        return this;
    };

    this.initialize();
};
