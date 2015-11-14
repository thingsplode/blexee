/* global SIMULATION, simuData, ble */

var DeviceService = function (configService) {
    var self = this;
    var deviceModel = {
        /**
         * true is bluetooth device is enabled
         */
        bluetooth: true,
        /**
         * true while searching for bluetooth low energy devices
         */
        searching: false,
        /**
         * true while approximating and connecting to a ble device
         */
        connecting: false,
        /**
         * True while requesting gatt services from a connected ble device
         */
        requestingServices: false,
        /**
         * true when connected to a ble device
         */
        connected: false,
        /**
         * the details of the ble device which we are going to connect to or which we have connected to
         */
        selectedDevice: '',
        /**
         * all available devices found by the scanning operation
         */
        devices: [],
        /**
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

    /**
     * Initializer function
     * @returns {unresolved}
     */
    this.initialize = function () {
        // No Initialization required
        var deferred = $.Deferred();
        if (configService.getValue('/blexee/simuMode')) {
            $.getScript("device_simulation.js", function () {
                alert("Script loaded but not necessarily executed.");
            });
        }
        deferred.resolve();
        return deferred.promise();
    };
    /**
     * Scans bluetooth low energy devices
     * @returns {unresolved} a promis which you can refer with done()
     */
    this.scanForDevices = function () {
        console.log('deviceService :: scan for devices');
        deviceModel.searching = true;
        var deferred = $.Deferred();
        this.bluetoothEnabled().done(function (bluetoothEnabledStatus) {
            if (bluetoothEnabledStatus) {
                if (configService.getValue('/blexee/simuMode')) {
                    //simulation
                    setTimeout(function () {
                        console.log('--> device service timeout simulation triggered');
                        console.log("SIMU --> devices: " + simuService.getSimuData().devices_available);
                        if (simuService.getSimuData().devices_available) {
                            deviceModel.devices = simuService.getSimuDevices();
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
    
    /**
     * Serarches for a devices and once reached the preconfigured proximity limit it connects to it.
     * @param {type} deviceID the device id to connect to
     * @param {type} success the function which will be called, once the connection should took place;
     * @param {type} failure the function which shall be called if theres a failure;
     * @returns {undefined}
     */
    this.approximateAndConnectDevice = function (deviceID, success, failure) {
        try {
            deviceModel.searching = false;
            deviceModel.connected = false;
            deviceModel.connecting = false;
            //todo: make a prescan
            if (configService.getValue('/blexee/simuMode')) {
                //in simulation mode
                deviceModel.devices = simuService.getSimuDevices();
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
                if (configService.getValue('/blexee/simuMode')) {
                    console.log("SIMU :: --> simulating approximation process");
                    if (simuService.getSimuData().can_connect) {
                        simuService.approximationSimuLoop(-100, deviceModel, modelControl, function () {
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

    /**
     * @private
     * @param {type} devID
     * @param {type} succeeded
     * @param {type} failed
     * @returns {undefined}
     */
    function approximationLoop(devID, succeeded, failed) {
        //todo: stop approximation loop if the user switches to a new screen while approximation is running
        try {
            console.log("Entering approximation loop with devce id [" + devID + "] // stringified value: [" + JSON.stringify(devID) + "]");
            var aborted = false;
            scanHardware(devID).done(function (providedRssi) {
                try {
                    console.log("proximity [" + deviceModel.selectedDevice.proximity + "] at rssi [" + providedRssi + "]");
                    deviceModel.selectedDevice.proximity = getPercentFromRssi(providedRssi);
                    modelControl.update(providedRssi);
                    if (providedRssi < configService.getValue('/blexee/connectLimit') && !aborted) {
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

    /**
     * @private
     * @param {type} devID
     * @returns {unresolved}
     */
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
            console.log("HW --> could not start scanning...");
            deferred.reject("Could not start scaning", "There was an error, the system could not be scanned.");
        });
        return deferred.promise();
    }

    /**
     * @private
     * @param {type} rssi
     * @returns {Number}
     */
    function getPercentFromRssi(rssi) {
        var proximity = (100 - (rssi * -1));
        console.log("calculated proximity: [" + proximity + "] at rssi [" + rssi + "]");
        return proximity;
    }

    /**
     * Request a list of available GATT service from the device
     * @returns {unresolved}
     */
    this.requestServices = function () {
        var deferred = $.Deferred();
        console.log('deviceService :: requesting available services');
        if (!deviceModel.connected) {
            deferred.reject(new ErrorMessage('Device is not connected', 'Before requesting device-services, please connect first a bluetooth low energy device'));
        } else if (!this.bluetoothEnabled()) {
            deferred.reject(new ErrorMessage('Bluetooth is not enabled', 'Before requesting device-services, please enable your bluetooth and connect a bluetooth low energy device'));
        } else {
            deviceModel.requestingServices = true;
            if (!configService.getValue('/blexee/simuMode')) {
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
                    if (simuService.getSimuData().services_available) {
                        //deviceModel.services = getGattServices(bigPeripheralObj);
                        deviceModel.services = getGattServices(simuService.getRealPeripheralObject());
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


    /**
     * 
     * @param {type} success
     * @param {type} failure
     * @returns {undefined}
     */
    this.disconnect = function (success, failure) {
        deviceModel.searching = false;
        deviceModel.devices = [];
        deviceModel.services = [];
        if (!configService.getValue('/blexee/simuMode') && deviceModel.connected) {
            ble.isConnected(deviceModel.selectedDevice.id, function () {
                console.log('HW --> Disconnecting from [' + deviceModel.selectedDevice.id + '].');
                ble.disconnect(deviceModel.selectedDevice.id, function () {
                    //Successfully disconnected
                    console.log('HW --> disconnected');
                    deviceModel.connecting = false;
                    deviceModel.connected = false;
                    deviceModel.selectedDevice = '';
                    success();
                }, failure);
            }, function () {
                //was not connected
                console.log('HW --> Device [' + deviceModel.selectedDevice.id + '] was not connected.');
            });
        } else {
            //simu mode
            console.log('SIMU :: --> Disconnecting from [' + deviceModel.selectedDevice.id + '].');
            deviceModel.selectedDevice = '';
            success();
        }
    };


    /**
     * 
     * @param {type} serviceUuid
     * @param {type} characteristicUuid
     * @param {type} arrayBufferData
     * @param {type} success
     * @param {type} failure
     * @returns {undefined}
     */
    this.writeData = function (serviceUuid, characteristicUuid, arrayBufferData, success, failure) {
        if (deviceModel.connected && deviceModel.selectedDevice !== null) {
            if (!configService.getValue('/blexee/simuMode')) {
                ble.isConnected(deviceModel.selectedDevice.id, function () {
                    //todo: make a hexa writer
                    ble.write(deviceModel.selectedDevice.id, serviceUuid, characteristicUuid, arrayBufferData, success, function () {
                        failure(new ErrorMessage("Couldn't write data", "Please make sure that you've wrote data which is acceptable."));
                    });
                }, function () {
                    failure(new ErrorMessage("Device is not connected", "Please make sure that the device is connected first."));
                });
            } else {
                console.log("SIMU :: -- write --> service [" + serviceUuid + "] characteristic [" + characteristicUuid + "] + data " + arrayBufferData);
                success();
            }
        }
    };

    // ASCII only
    this.stringToBytes = function stringToBytes(string) {
        var array = new Uint8Array(string.length);
        for (var i = 0, l = string.length; i < l; i++) {
            array[i] = string.charCodeAt(i);
        }
        return array.buffer;
    };

    // ASCII only
    function bytesToString(buffer) {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }

    this.parseHexString = function (str) {
        str = str.replace(/ /g, '');
        console.log('HEXX PARSER ::: original string [' + str + '] / string length [' + str.length + ']');
        var result = new Uint8Array(str.length / 2);
        var index = 0;
        while (str.length >= 2) {
            result[index] = parseInt(str.substring(0, 2), 16);
            str = str.substring(2, str.length);
            index++;
        }
        console.log('HEXX PARSER ::: byte length [' + result.byteLength + ']');
        console.log('HEXX PARSER ::: length [' + result.length + ']');
        console.log('CHARS: ' + bytesToString(result.buffer));
        return result.buffer;
    };

    function createHexString(arr) {
        var result = "";
        var z;

        for (var i = 0; i < arr.length; i++) {
            var str = arr[i].toString(16);

            z = 8 - str.length + 1;
            str = Array(z).join("0") + str;

            result += str;
        }

        return result;
    }

    this.getModelControl = function () {
        return modelControl;
    };
    this.getDeviceModel = function () {
        return deviceModel;
    };
    /**
     * Checks if the bluetooth device is enabled.
     * @returns {unresolved}
     */
    this.bluetoothEnabled = function () {
        var deferred = $.Deferred();
        if (configService.getValue('/blexee/simuMode')) {
            //simulation mode is activated
            console.log("SIMU --> bluetooth: " + simuService.getSimuData().bluetooth_enabled);
            deferred.resolve(simuService.getSimuData().bluetooth_enabled);
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

    
    /**
     * 
     * @param {type} peripheralObject
     * @returns {Array|DeviceService.getGattServices.gattSrvs}
     */
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

    var simuService;
    createSimuService(configService.getValue('/blexee/simuMode'));
    configService.registerTriggerableFunction('simuServiceSetup', '/blexee/simuMode', createSimuService);

    function createSimuService(simuMode) {
        if (!simuMode) {
            simuService = null;
            delete simuService;
        } else {
            simuService = new SimuService(configService);
        }
    }
//    var simuService;
//    var imported = document.createElement('script');
//    imported.src = 'js/services/SimuService.js';
//    document.head.appendChild(imported);
//    $(document).ready(function () {
//        
//    });
};
