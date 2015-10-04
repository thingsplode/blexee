var DeviceService = function () {
    this.initialize = function () {
        // No Initialization required
        var deferred = $.Deferred();
        deferred.resolve();
        return deferred.promise();
    };

    this.findAll = function () {
        console.log('deviceService :: findAll');
        var deferred = $.Deferred();
        deferred.resolve(devices);
        return deferred.promise();
    };

    var devices = [
    {"name": "TI SensorTag", "id": "BD922605-1B07-4D55-8D09-B66653E51BBA", "rssi": - 79, "advertising": []},
    {"name": "Some Other Device", "id": "BD922605-1B07-4D55-8D09-B66653E51B23A", "rssi": - 79, "advertising": []},
    ];
}; 