var GenericView = function (viewName, template, dataProvider) {
    
    var template, data;
    this.initialize = function () {
        this.$el = $('<div/>');
        data = dataProvider(this);
        this.render(data);
        console.log(viewName + ' :: initialized');
    };

    this.resetData = function(dta){
        data = dta;
    };

    this.render = function () {
        console.log(viewName + ' :: rendering');
        console.log(viewName + ' [data]--> '+JSON.stringify(data));
        this.$el.html(template(data));
        return this;
    };
    
    this.initialize();
};