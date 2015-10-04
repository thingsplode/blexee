var DeviceView = function () {

//    var employees;

    this.initialize = function() {
        this.$el = $('<div/>');
        this.render();
    };

//    this.setEmployees = function(list) {
//        employees = list;
//        this.render();
//    }

    this.render = function() {
        //this.$el.html(this.template(empl1oyees));
        this.$el.html(this.template());
        return this;
    };

    this.initialize();

}