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

    this.approximateAndConnectDevice = function (deviceID, success, failure) {
        deviceModel.searching = false;
        deviceModel.connected = false;
        deviceModel.connecting = false;
        //todo: make a prescan
        if (SIMULATION) {
            deviceModel.devices = devices;
        } else {
            failure();
        }

        if (deviceModel.devices) {
            for (i = 0; i < deviceModel.devices.length; i++) {
                if (deviceModel.devices[i].id === deviceID) {
                    deviceModel.connecting = true;
                    deviceModel.selectedDevice = deviceModel.devices[i];
                    console.log("--> found device to connect to: " + JSON.stringify(deviceModel.selectedDevice));
                    break;
                }
            }
            if (deviceModel.selectedDevice !== null && deviceModel.connecting) {
                if (SIMULATION) {
                    if (simuData.can_connect) {
                        approximationSimuLoop(-100, deviceModel, modelControl, function () {
                            deviceModel.connecting = false;
                            deviceModel.connected = true;
                            deviceModel.searching = false;
                            success();
                        });
                    } else {
                        failure(new ErrorMessage("Cannot Connect","Connection currently is in simulation mode and is not allowed. Please re-set the can_connect value in the simuData object."));
                    }
                } else {
                    failure("Cannot Connect","Simulation is not enabled, but the real hardware is not implemented yet.");
                }
            } else {
                failure("Cannot connect","No device was selected and it is not in connecting mode.");
            }
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

    function approximationSimuLoop(i, deviceModel, modelControl, finished) {
        setTimeout(function () {
            var x = 100 - (i * -1);
            console.log("SIMU --> proximity value: " + x + " [at rssi: ]" + i);
            deviceModel.selectedDevice.proximity = x;
            modelControl.update(i);
            i++;
            if (i < 0) {
                approximationSimuLoop(i, deviceModel, modelControl, finished);
            } else {
                console.log(" ---> " + JSON.stringify(finished));
                finished();
            }
        }, 100);
    }
};
