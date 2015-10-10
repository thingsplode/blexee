var DeviceService = function () {

    var SIMULATION = true;

    var modelControl = $.extend($({}), (function (o) {
        o.update = function () {
            o.trigger('modup', deviceModel);
        };
        return o;
    })($({})));

    this.initialize = function () {
        // No Initialization required
        var deferred = $.Deferred();
        deferred.resolve();
        return deferred.promise();
    };
    this.searchDevices = function () {
        console.log('deviceService :: findAll');
        var deferred = $.Deferred();
        if (this.bluetoothEnabled()) {
            setTimeout(function () {
                console.log('--> device service timeout simulation triggered');
                deviceModel.devices = devices;
                deviceModel.bluetooth = true;
                deviceModel.searching = false;
                deferred.resolve(deviceModel);
            }, 2000);
        } else {
            deviceModel.searching = false;
            deviceModel.bluetooth = false;
            modelControl.update();
        }
        return deferred.promise();
    };

    this.connectDevice = function (deviceID){
        deviceModel.searching = false;
        deviceModel.connected = true;
    };
    
    this.getModelControl = function () {
        return modelControl;
    };

    this.getModel = function () {
        return deviceModel;
    };

    var deviceModel = {
        'bluetooth': true,
        'searching': true,
        'connected': false,
        devices: []
    };

    this.bluetoothEnabled = function () {
        return true;
    };

    var devices = [{"name": "TI SensorTag", "id": "BD922605-1B07-4D55-8D09-B66653E51BBA", "rssi": -79, "advertising": {
                "kCBAdvDataChannel": 37,
                "kCBAdvDataServiceData": {
                    "FED8": {
                        "byteLength": 7 /* data not shown */
                    }
                },
                "kCBAdvDataLocalName": "local-name",
                "kCBAdvDataServiceUUIDs": ["FED8"],
                "kCBAdvDataManufacturerData": {
                    "byteLength": 7  /* data not shown */
                },
                "kCBAdvDataTxPowerLevel": 32,
                "kCBAdvDataIsConnectable": true
            }},
        {"name": "Some Other Device", "id": "BD922605-1B07-4D55-8D09-B66653E51B23A", "rssi": -79, "advertising": {
                "kCBAdvDataChannel": 37,
                "kCBAdvDataServiceData": {
                    "FED8": {
                        "byteLength": 7 /* data not shown */
                    }
                },
                "kCBAdvDataLocalName": "demo",
                "kCBAdvDataServiceUUIDs": ["FED8"],
                "kCBAdvDataManufacturerData": {
                    "byteLength": 7  /* data not shown */
                },
                "kCBAdvDataTxPowerLevel": 32,
                "kCBAdvDataIsConnectable": true
            }}
    ];
};
