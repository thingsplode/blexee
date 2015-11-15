var GenericView = function (viewName, template, dataProvider) {

    var mdl, modelCtrl;

    this.initialize = function () {
        this.$el = $('<div id="generic_view"/>');
        mdl = dataProvider(this);
        this.render(mdl);
        console.log(viewName + ' :: initialized');
    };

    this.registerModelControl = function (modelControl) {
        var view = this;
        modelCtrl = modelControl;
        modelCtrl.on('modup', function (e, data) {
            console.log(viewName + ' :: Model updated -> [event] ' + JSON.stringify(e) + '[model data] ' + JSON.stringify(data));
            console.log(viewName + ' :: Model updated -> [event] ' + JSON.stringify(e));
            view.setModel(data);
            view.render();
        });
    };

    this.unregisterModelControl = function () {
        if (typeof modelCtrl !== 'undefined') {
            modelCtrl.off();
        }
    };

    this.setModel = function (model) {
        mdl = model;
    };

    this.getViewName = function () {
        return viewName;
    };

    this.render = function () {
        try {
            console.log(viewName + ' :: rendering with [modeldata]--> ' + JSON.stringify(mdl));
            this.$el.html(template(mdl));
        } catch (err) {
            console.log("ERROR: rendering error --> " + err + '\n' + err.stack);
            this.$el.html(err);
        }
        return this;
    };

    this.initialize();
};
