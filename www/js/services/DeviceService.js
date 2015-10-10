/* global SIMULATION, simuData */

var DeviceService = function () {

    var modelControl = $.extend($({}), (function (o) {
        o.update = function () {
            o.trigger('modup', deviceModel);
        };
        return o;
    })($({})));

    this.initialize = function () {
        // No Initialization required
        var deferred = $.Deferred();
        if (SIMULATION) {
            $.getScript("device_simulation.js", function () {
                alert("Script loaded but not necessarily executed.");
            });
        }
        deferred.resolve();
        return deferred.promise();
    };
    this.searchDevices = function () {
        console.log('deviceService :: findAll');
        var deferred = $.Deferred();
        if (this.bluetoothEnabled()) {
            if (SIMULATION) {
                //simulation
                setTimeout(function () {
                    console.log('--> device service timeout simulation triggered');
                    console.log("SIMU --> devices: " + simuData.devices_available);
                    if (simuData.devices_available) {
                        deviceModel.devices = devices;
                    }
                    deviceModel.bluetooth = true;
                    deviceModel.searching = false;
                    deferred.resolve(deviceModel);
                }, 2000);
            } else {
                //real use case
            }
        } else {
            deviceModel.searching = false;
            deviceModel.bluetooth = false;
            modelControl.update();
        }
        return deferred.promise();
    };

    this.selectAndApproximateDevice = function (deviceID, success, failure) {
        deviceModel.searching = false;
        deviceModel.connected = false;
        deviceModel.connecting = false;
        if (deviceModel.devices) {
            deviceModel.devices.forEach(function (thisDevice) {
                console.log(thisDevice);
                if (thisDevice.id === deviceID){
                    deviceModel.connecting = false;
                    deviceModel.selectedDevice = thisDevice;
                }
            });
        }
        if (deviceModel.connecting){
            
        }
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
        'connecting': false,
        'selectedDevice': '',
        devices: []
    };

    this.bluetoothEnabled = function () {
        if (SIMULATION) {
            console.log("SIMU --> bluetooth: " + simuData.bluetooth_enabled);
            return simuData.bluetooth_enabled;
        } else {
            return false;
        }

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
