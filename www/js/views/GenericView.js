var GenericView = function (viewName, template, dataProvider) {

    var mdl, modelCtrl;
    this.initialize = function () {
        this.$el = $('<div/>');
        mdl = dataProvider(this);
        this.render(mdl);
        console.log(viewName + ' :: initialized');
    };

    this.registerModelControl = function (modelControl) {
        //modelCtrl = modelControl;
        //todo: unregister model control http://api.jquery.com/off/
        modelControl.on('modup', function (e, data) {
            console.log(viewName + ' :: Model updated ->' + e);
            this.resetData(data);
            this.render();
        });
    };

    this.setModel = function (model) {
        mdl = model;
    };

    this.getViewName = function (){
        return viewName;
    };

    this.render = function () {
        console.log(viewName + ' :: rendering');
        console.log(viewName + ' [data]--> ' + JSON.stringify(mdl));
        this.$el.html(template(mdl));
        return this;
    };

    this.initialize();
};