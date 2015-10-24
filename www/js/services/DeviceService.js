/* global SIMULATION, simuData, ble */

var DeviceService = function () {

    var deviceModel = {
        /*
         * true is bluetooth device is enabled
         */
        bluetooth: true,
        /*
         * true while searching for bluetooth low energy devices
         */
        searching: false,
        /*
         * true while approximating and connecting to a ble device
         */
        connecting: false,
        /*
         * True while requesting gatt services from a connected ble device
         */
        requestingServices: false,
        /*
         * true when connected to a ble device
         */
        connected: false,
        /*
         * the details of the ble device which we are going to connect to or which we have connected to
         */
        selectedDevice: '',
        /*
         * all available devices found by the scanning operation
         */
        devices: [],
        /*
         * the gatt services of devices
         */
        services: []
    };
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
    /*
     * Scans bluetooth low energy devices
     * @returns {unresolved} a promis which you can refer with done()
     */
    this.scanForDevices = function () {
        console.log('deviceService :: scan for devices');
        deviceModel.searching = true;
        var deferred = $.Deferred();
        this.bluetoothEnabled.done(function (bluetoothEnabledStatus) {
            if (bluetoothEnabledStatus) {
                if (SIMULATION) {
                    //simulation
                    setTimeout(function () {
                        console.log('--> device service timeout simulation triggered');
                        console.log("SIMU --> devices: " + simuData.devices_available);
                        if (simuData.devices_available) {
                            deviceModel.devices = simuDevices;
                        }
                        deviceModel.bluetooth = true;
                        deviceModel.searching = false;
                        deferred.resolve(deviceModel);
                    }, 2000);
                } else {
                    //real use case
                    deviceModel.searching = true;
                    deviceModel.selectedDevice = '';
                    deviceModel.devices = [];
                    deviceModel.services = [];
                    ble.startScan([], function (device) {
                        //found a device
                        console.log('HW --> device found: ' + JSON.stringify(device));
                        deviceModel.devices.push(device);
                        modelControl.update();
                    }, function () {
                        //failure while searching for a device
                        console.log('HW --> failure while scanning for device.');
                    });
                    setTimeout(ble.stopScan,
                            5000,
                            function () {
                                console.log("HW --> Scan complete");
                                deviceModel.searching = false;
                                deferred.resolve(deviceModel);
                            },
                            function () {
                                console.log("HW --> stopScan failed");
                                deviceModel.searching = false;
                                deferred.resolve(deviceModel);
                            }
                    );
                }
            } else {
                //bluetooth is not enabled
                deviceModel.searching = false;
                deviceModel.bluetooth = false;
                modelControl.update();
                deferred.resolve(deviceModel);
            }
            ;
        });
        return deferred.promise();
    };
    this.approximateAndConnectDevice = function (deviceID, success, failure) {
        deviceModel.searching = false;
        deviceModel.connected = false;
        deviceModel.connecting = false;
        //todo: make a prescan
        if (SIMULATION) {
            //in simulation mode
            deviceModel.devices = simuDevices;
        }

        if (deviceModel.devices) {
            //configure selected device in simu mode
            for (i = 0; i < deviceModel.devices.length; i++) {
                if (deviceModel.devices[i].id === deviceID) {
                    deviceModel.connecting = true;
                    deviceModel.selectedDevice = deviceModel.devices[i];
                    console.log("--> found device to connect to: " + JSON.stringify(deviceModel.selectedDevice));
                    break;
                }
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
                //in REAL hardware mode
                //rssi to be expected between -100 and -26
                var rssi = -100;
                //console.log("HW --> BLE device proximity value: " + x + " [at rssi: ]" + i);
                deviceModel.connectedDevice.proximity = getPercentFromRssi(rssi);
                modelControl.update(rssi);
                approximationLoop(deviceID, function () {
                    //succeeded
                    deviceModel.connecting = false;
                    deviceModel.connected = true;
                    deviceModel.searching = false;
                    success();
                }, function (title, text) {
                    //failed
                    failure(new ErrorMessage(title, text));
                });
            }
        } else {
            failure("Cannot connect", "No device was selected and it is not in connecting mode.");
        }
    };

    function approximationLoop(devID, succeeded, failed) {
        var aborted = false;
        hwScan(devID).done(function (providedRssi) {
            deviceModel.connectedDevice.proximity = getPercentFromRssi(providedRssi);
            modelControl.update(providedRssi);
            if (providedRssi < -26 && !aborted) {
                approximationLoop(deviceModel, succeeded, failed);
            } else {
                ble.connect(devID, succeeded, failed);
            }
        }).fail(function (title, text) {
            aborted = true;
            failed(title, text);
        });
    }

    function hwScan(deviceID) {
        var deferred = $.Deferred();
        ble.startScan([], function (device) {
            if (device.id === deviceID) {
                ble.stopScan(function () {
                    deferred.resolve(device.rssi);
                }, function () {
                    //failing to stop scanning
                    deferred.reject("Could not stop scaning", "The device was scanned, but scanning could not be stopped.");
                });
            }
        }, function () {
            deferred.reject("Could not start scaning", "There was an error, the system could not be scanned.");
        });
        return deferred.promise();
    }

    function getPercentFromRssi(rssi) {
        return 100 - (rssi * -1);
    }

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


    this.disconnect = function (success, failure) {
        if (!SIMULATION && deviceModel.connected) {
            ble.disconnect(deviceModel.selectedDevice.id, success, failure);
        }
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
    /*
     * Checks if the bluetooth device is enabled.
     * @returns {unresolved}
     */
    this.bluetoothEnabled = function () {
        var deferred = $.Deferred();
        if (SIMULATION) {
            //simulation mode is activated
            console.log("SIMU --> bluetooth: " + simuData.bluetooth_enabled);
            deferred.resolve(simuData.bluetooth_enabled);
        } else {
            //real hardware mode
            ble.isEnabled(function () {
                //success
                console.info('HW :: --> bluetooth is enabled.');
                deviceModel.bluetooth = true;
                deferred.resolve(true);
            }, function () {
                //failure
                console.info('HW :: --> bluetooth is false.');
                deviceModel.bluetooth = false;
                deferred.resolve(false);
            });
        }
        return deferred.promise();
    };
    var simuDevices = [{"name": "TI SensorTag", "id": "BD922605-1B07-4D55-8D09-B66653E51BBA", "rssi": -79, "advertising": {
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

    /**
     * 
     * @param {type} i loop count (should be -100)
     * @param {type} deviceModel the model whihc contains all the devices
     * @param {type} modelControl the model control which needs to be updated
     * @param {type} finished finish method
     * @returns {undefined}
     */
    function approximationSimuLoop(i, deviceModel, modelControl, finished) {
        setTimeout(function () {
            var x = 100 - (i * -1);
            console.log("SIMU --> proximity value: " + x + " [at rssi: ]" + i);
            deviceModel.connectedDevice.proximity = x;
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
