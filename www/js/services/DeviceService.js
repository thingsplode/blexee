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
    this.scanForDevices = function () {
        console.log('deviceService :: scan for devices');
        deviceModel.searching = true;
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
                deferred.resolve(deviceModel);
            }
        } else {
            deviceModel.searching = false;
            deviceModel.bluetooth = false;
            modelControl.update();
            deferred.resolve(deviceModel);
        }
        return deferred.promise();
    };

    this.requestServices = function (failure) {
        console.log('deviceService :: requesting available services');
        if (!deviceModel.connected) {
            failure(new ErrorMessage('Device is not connected', 'Before requesting device-services, please connect first a bluetooth low energy device'));
        } else if (!this.bluetoothEnabled()) {
            failure(new ErrorMessage('Bluetooth is not enabled', 'Before requesting device-services, please enable your bluetooth and connect a bluetooth low energy device'));
        } else {
            deviceModel.requestingServices = true;
            var deferred = $.Deferred();
            if (!SIMULATION) {
                //real use case
                failure(new ErrorMessage('Simulation is disabled', 'Real hardware support is not enabled yet'));
            } else {
                setTimeout(function () {
                    if (simuData.services_available) {
                        deviceModel.services = gattServices;
                    }
                    deviceModel.requestingServices = false;
                    modelControl.update();
                    console.log('SIMU --> triggered service retrieval simuation');
                }, 2000);
            }
            deferred.resolve(deviceModel);
            return deferred.promise();
        }
        return $.Deferred().resolve().promise();
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
                        failure(new ErrorMessage("Cannot Connect", "Connection currently is in simulation mode and is not allowed. Please re-set the can_connect value in the simuData object."));
                    }
                } else {
                    failure("Cannot Connect", "Simulation is not enabled, but the real hardware is not implemented yet.");
                }
            } else {
                failure("Cannot connect", "No device was selected and it is not in connecting mode.");
            }
        }
    };

    this.disconnect = function (deviceID) {
        //if (deviceModel.selectedDevice['id'] === deviceID){
        deviceModel.connecting = false;
        deviceModel.connected = false;
        deviceModel.searching = false;
        deviceModel.selectedDevice = '';
        deviceModel.devices = [];
        //} else {        };
    };

    this.getGattServices = function () {
        console.log('DeviceService :: getGattServices');
        var deferred = $.Deferred();
        deferred.resolve(gattServices);
        return deferred.promise();
    };


    this.getModelControl = function () {
        return modelControl;
    };

    this.getDeviceModel = function () {
        return deviceModel;
    };

    var deviceModel = {
        bluetooth: true,
        searching: false,
        connecting: false,
        requestingServices: false,
        connected: false,
        selectedDevice: '',
        devices: [],
        services: []
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

    var gattServices = [
        {"id": 1, "uuid": "0x1800", "primary": "true", "Characteristics": [
                {"uuid": "0x2A00", "flags": "read,write", "User Descriptor": "device_name"},
                {"uuid": "0x2A01", "flags": "read", "User Descriptor": "appearance"},
                {"uuid": "3334", "flags": "notify", "User Descriptor": "Yet Another Description"},
            ]},
        {"id": 2, "uuid": "223456", "primary": "true", "Characteristics": [{"uuid": "2345", "flags": "read", "User Descriptor": "A Description"}]},
        {"id": 3, "uuid": "323456", "primary": "true", "Characteristics": [{"uuid": "2346", "flags": "write", "User Descriptor": "Another Description"}]},
        {"id": 4, "uuid": "423456", "primary": "true", "Characteristics": [{"uuid": "1345", "flags": "read", "User Descriptor": "So more Description"}]},
        {"id": 5, "uuid": "523456", "primary": "true", "Characteristics": [{"uuid": "989p", "flags": "read", "User Descriptor": "Some Description"}]},
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
        }, 20);
    }
};
