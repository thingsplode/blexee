var DeviceView = function (deviceService) {

    var devices, view;

    this.initialize = function() {
        console.log('DeviceView :: initialzing');
        this.$el = $('<div/>');
        view = this;
        deviceService.findAll().done(function (deviceList) {
            console.log('Device View :: re-render/updated');
            devices = deviceList;
            view.render();
        });
        this.render();
        console.log('DeviceView :: initialized');
    };

    this.render = function() {
        console.log('DeviceView :: rendering');
        this.$el.html(this.template(devices));
        return this;
    };

    this.initialize();

}