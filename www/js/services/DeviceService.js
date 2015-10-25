/* global SIMULATION, CONNECT_LIMIT, simuData, ble */

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
        this.bluetoothEnabled().done(function (bluetoothEnabledStatus) {
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
                            //todo: this will hang until the timeout is not passed, better would be an advertisement based hangup of the scanning
                            3000,
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
        try {
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
                        break;
                    }
                }
                console.log("--> found device to connect to: " + JSON.stringify(deviceModel.selectedDevice));
            }

            if (deviceModel.selectedDevice !== null && deviceModel.connecting) {
                if (SIMULATION) {
                    console.log("SIMU :: --> simulating approximation process");
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
                    console.log("HW --> starting approximation and connection procedure.");
                    var rssi = -100;
                    deviceModel.selectedDevice.proximity = getPercentFromRssi(rssi);
                    console.log("HW --> BLE device default proximity value: " + deviceModel.selectedDevice.proximity + " [at rssi: ]" + rssi);
                    modelControl.update(rssi);
                    approximationLoop(deviceID, function (peripheralObject) {
                        //succeeded
                        // a peripheral object is handed over: https://github.com/don/cordova-plugin-ble-central/tree/a16b1746cba3292e5eb2f2b026cfbd465ea59c5f#peripheral-data
                        deviceModel.connecting = false;
                        deviceModel.connected = true;
                        deviceModel.searching = false;
                        deviceModel.services = getGattServices(peripheralObject);
                        console.log('HW --> Connection was succesfull; peripheral object: ' + JSON.stringify(peripheralObject));
                        success();
                    }, function (title, text) {
                        //failed
                        console.log("HW --> failed to connect to device [" + title + "] [" + text + "]");
                        failure(new ErrorMessage(title, text));
                    });
                }
            } else {
                console.log("Cannot connect, because there's no selected device [" + deviceModel.selectedDevice !== null + "] or not connecting [" + deviceModel.connecting + "]");
                failure("Cannot connect", "No device was selected and it is not in connecting mode.");
            }
        } catch (err) {
            console.log("ERROR: " + err);
            failure(err);
        }
    };

    function approximationLoop(devID, succeeded, failed) {
        try {

            console.log("Entering approximation loop with devce id [" + devID + "] // stringified value: [" + JSON.stringify(devID) + "]");
            var aborted = false;
            scanHardware(devID).done(function (providedRssi) {
                try {
                    console.log("proximity [" + deviceModel.selectedDevice.proximity + "] at rssi [" + providedRssi + "]");
                    deviceModel.selectedDevice.proximity = getPercentFromRssi(providedRssi);
                    modelControl.update(providedRssi);
                    if (providedRssi < CONNECT_LIMIT && !aborted) {
                        //todo: sometimes the rssi is very high (eg +127), so a double check is needed
                        console.log("HW --> the device is not close enough, rescanning...");
                        setTimeout(function () {
                            approximationLoop(devID, succeeded, failed);
                        }, 1000);
                    } else {
                        console.log("HW --> Device is close enough to connect / provided rssi [" + providedRssi + "]");
                        ble.connect(devID, succeeded, failed);
                    }
                } catch (err) {
                    console.log("Approximation loop :: error caugth:" + err);
                    failed("Error in Approximation Loop", err);
                }
            }).fail(function (title, text) {
                console.log('HW --> failed to approximate and loop');
                aborted = true;
                disconnect(function () {
                }, function () {
                });
                failed(title, text);
            });

        } catch (err) {
            console.log("Error catched while approximating the device:" + err);
            failed("Exception caught", err);
        }
    }

    function scanHardware(devID) {
        var deferred = $.Deferred();
        ble.startScan([], function (device) {
            try {
                //todo: never times out the scanning / therefore if somebody goes out of the region while scanning, the app will hang |> switch to time based stop implementation
                console.log("HW --> Device found: " + JSON.stringify(device));
                console.log("HW --> requested device id [" + devID + "] / found ID: [" + device.id + "]");
                if (device.id === devID) {
                    console.log("stopping scanning.");
                    ble.stopScan(function () {
                        console.log("Scanning stopped for device id [" + device.id + "] with rssi [" + device.rssi + "]");
                        deferred.resolve(device.rssi);
                    }, function () {
                        //failing to stop scanning
                        deferred.reject("Could not stop scaning", "The device was scanned, but scanning could not be stopped.");
                    });
                }
            } catch (err) {
                console.log("Error while scanning for hardware: " + err);
                deferred.reject("Scan failed", err);
            }
        }, function () {
            conosle.log("HW --> could not start scanning...");
            deferred.reject("Could not start scaning", "There was an error, the system could not be scanned.");
        });
        return deferred.promise();
    }

    function getPercentFromRssi(rssi) {
        var proximity = (100 - (rssi * -1));
        console.log("calculated proximity: [" + proximity + "] at rssi [" + rssi + "]");
        return proximity;
    }

    this.requestServices = function () {
        var deferred = $.Deferred();
        console.log('deviceService :: requesting available services');
        if (!deviceModel.connected) {
            deferred.reject(new ErrorMessage('Device is not connected', 'Before requesting device-services, please connect first a bluetooth low energy device'));
        } else if (!this.bluetoothEnabled()) {
            deferred.reject(new ErrorMessage('Bluetooth is not enabled', 'Before requesting device-services, please enable your bluetooth and connect a bluetooth low energy device'));
        } else {
            deviceModel.requestingServices = true;
            if (!SIMULATION) {
                //real HW use case
                if (deviceModel.connected && deviceModel.selectedDevice) {
                    //services are already retrieved while connecting and added to the device model
                    deviceModel.requestingServices = false;
                    modelControl.update(deviceModel);
                    deferred.resolve();
                } else {
                    deferred.reject(new ErrorMessage('Device is not connected', 'The device is not connected or device services are not recognized.'));
                }
            } else {
                //simulation mode
                setTimeout(function () {
                    if (simuData.services_available) {
                        //deviceModel.services = getGattServices(bigPeripheralObj);
                        deviceModel.services = getGattServices(peripheralObjectReal);
                    }
                    deviceModel.requestingServices = false;
                    console.log('SIMU --> triggered service retrieval simulation |devicemodel.services| ' + JSON.stringify(deviceModel.services));
                    modelControl.update(deviceModel);
                    deferred.resolve();
                }, 2000);
            }
        }
        return deferred.promise();
    };


    this.disconnect = function (success, failure) {
     deviceModel.searching = false;
     deviceModel.selectedDevice = '';
     deviceModel.devices = [];
     deviceModel.services = [];
        if (!SIMULATION && deviceModel.connected) {
            ble.isConnected(deviceModel.selectedDevice.id, function () {
             console.log('HW --> Disconnecting from [' + deviceModel.selectedDevice.id + '].');
                ble.disconnect(deviceModel.selectedDevice.id, function(){
                 //Successfully disconnected
                 console.log('HW --> disconnected');
                 deviceModel.connecting = false;
                 deviceModel.connected = false;
                 success();
                }, failure);
            }, function () {
                //was not connected
                console.log('HW --> Device [' + deviceModel.selectedDevice.id + '] was not connected.');
            });
        } else {
            //simu mode
            success();
        }
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

    var getGattServices = function (peripheralObject) {
        var gattSrvs = [];

        function GattService(id, uuid, characteristics) {
            this.id = id;
            this.uuid = uuid;
            this.characteristics = characteristics;
        }

        function GattCharacteristic(uuid, flags, descriptor) {
            this.uuid = uuid;
            this.flags = flags;
            this.descriptor = descriptor;
        }

        if (peripheralObject) {
            var serviceCounter = 0;
            for (i = 0; i < peripheralObject.characteristics.length; i++) {
                var peripheralChar = peripheralObject.characteristics[i];
                var found = false;
                for (var x = 0; x < gattSrvs.length; x++) {
                    if (gattSrvs[x].uuid === peripheralChar.service) {
                        //there's already a service with that uuid
                        gattSrvs[x].characteristics.push(new GattCharacteristic(peripheralChar.characteristic, peripheralChar.properties, ""));
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    //there's no service yet with that uuid
                    serviceCounter++;
                    var chars = [];
                    chars.push(new GattCharacteristic(peripheralChar.characteristic, peripheralChar.properties, ""));
                    var gs = new GattService(serviceCounter, peripheralChar.service, chars);
                    gattSrvs.push(gs);
                }
            }
            if (serviceCounter < 1) {
                console.log("WARNING: no services were created, while the peripheralObject.characteristics length is [" + peripheralObject.characteristics.length + "]");
                console.log("-- peripheral object characteristics --> " + JSON.stringify(peripheralObject.characteristics));
            }
        } else {
            console.log("WARNING: peripheral object seems to be undefined.");
        }
        return gattSrvs;
    };

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

    var wrongGattServices = [
        {"id": 1, "uuid": "0x1800", "primary": "true", "characteristics": [
                {"uuid": "0x2A00", "flags": "read,write", "descriptor": "device_name"},
                {"uuid": "0x2A01", "flags": "read", "descriptor": "appearance"},
                {"uuid": "3334", "flags": "notify", "descriptor": "Yet Another Description"},
            ]},
        {"id": 2, "uuid": "223456", "primary": "true", "characteristics": [{"uuid": "2345", "flags": "read", "descriptor": "A Description"}]},
        {"id": 3, "uuid": "323456", "primary": "true", "characteristics": [{"uuid": "2346", "flags": "write", "descriptor": "Another Description"}]},
        {"id": 4, "uuid": "423456", "primary": "true", "characteristics": [{"uuid": "1345", "flags": "read", "descriptor": "So more Description"}]},
        {"id": 5, "uuid": "523456", "primary": "true", "characteristics": [{"uuid": "989p", "flags": "read", "descriptor": "Some Description"}]},
    ];
    var peripheralObjectReal = {
        "name": "thing-0",
        "id": "291C9A2E-CCA3-1EF0-5C5C-E19E29973F16",
        "advertising": {
            "kCBAdvDataTxPowerLevel": 8,
            "kCBAdvDataIsConnectable": true,
            "kCBAdvDataServiceUUIDs": ["1815"],
            "kCBAdvDataServiceData":
                    {"9999": {}},
            "kCBAdvDataManufacturerData": {}},
        "services": ["1815"],
        "characteristics": [
            {"service": "1815", "isNotifying": false, "characteristic": "2A56", "properties": ["Write", "Notify", "ExtendedProperties"]}],
        "rssi": 127};

    var bigPeripheralObj = {
        "name": "Battery Demo",
        "id": "20:FF:D0:FF:D1:C0",
        "advertising": [2, 1, 6, 3, 3, 15, 24, 8, 9, 66, 97, 116, 116, 101, 114, 121],
        "rssi": -55,
        "services": [
            "1800",
            "1801",
            "180f"
        ],
        "characteristics": [
            {
                "service": "1800",
                "characteristic": "2a00",
                "properties": [
                    "Read"
                ]
            },
            {
                "service": "1800",
                "characteristic": "2a01",
                "properties": [
                    "Read","Write","Notify"
                ]
            },
            {
                "service": "1801",
                "characteristic": "2a05",
                "properties": [
                    "Read"
                ]
            },
            {
                "service": "180f",
                "characteristic": "2a19",
                "properties": [
                    "Read"
                ],
                "descriptors": [
                    {
                        "uuid": "2901"
                    },
                    {
                        "uuid": "2904"
                    }
                ]
            }
        ]
    };
};
