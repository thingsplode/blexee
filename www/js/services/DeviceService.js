/* global SIMULATION, simuData, ble, cordova, TRACE, DEBUG, scanBluetoothHardware */

var DeviceService = function (configService, mdlService) {
    var self = this, cancelApproximation = false, mdlControl = mdlService.getControl();
    /**
     * true is bluetooth device is enabled
     */
    mdlService.setModelData('bluetooth', true);
    /**
     * true while searching for bluetooth low energy devices
     */
    mdlService.setModelData('searching', false);
    /**    
     * true while approximating and connecting to a ble device
     */
    mdlService.setModelData('connecting', false);
    /**
     * True while requesting gatt services from a connected ble device
     */
    mdlService.setModelData('requestingServices', false);
    /**
     * true when connected to a ble device
     */
    mdlService.setModelData('connected', false);
    /**
     * the details of the ble device which we are going to connect to or which we have connected to
     */
    mdlService.setModelData('selectedDevice', '');
    /**
     * all available devices found by the scanning operation
     */
    mdlService.setModelData('devices', []);
    /**
     * the gatt services of devices
     */
    mdlService.setModelData('services', []);

    /**
     * Initializer function
     * @returns {unresolved} a promise which you can refer with done()
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
     * Scans a barcode and returns a promise; within the done function the result is handed over (result.text, result.format, result.cancelled)
     * @returns {unresolved} a promise which you can refer with done() or fail()
     */
    this.scanBarcode = function () {
        console.log('deviceService :: scan for barcode');
        var deferred = $.Deferred();
        if (configService.getValue('/blexee/simuMode')) {
            //simulated mode
            deferred.resolve({'text': 'abcdefgh', 'format': 'CODE_128', 'cancelled': 'false'});
        } else {
            //real mode
            cordova.plugins.barcodeScanner.scan(function (result) {
                console.log('deviceService :: barcode scanned: [' + result.text + "] of type [" + result.format + "] / status: [" + result.cancelled + "]");
                deferred.resolve(result);
            }, function (error) {
                deferred.reject(new ErrorMessage('Scanning failed', error));
            });
        }
        return deferred.promise();
    };
    /**
     * Scans bluetooth low energy devices for 3 seconds and returns a list of found devices;
     * @returns {unresolved} a promise which you can refer with done()
     */
    this.scanForDevices = function () {
        console.log('deviceService :: scan for devices');
        mdlService.setModelData('searching', true);
        var deferred = $.Deferred();
        this.bluetoothEnabled().done(function (bluetoothEnabledStatus) {
            if (bluetoothEnabledStatus) {
                if (configService.getValue('/blexee/simuMode')) {
                    //simulation mode
                    setTimeout(function () {
                        console.log('--> device service timeout simulation triggered');
                        console.log("SIMU --> devices: " + simuService.getSimuData().devices_available);
                        if (simuService.getSimuData().devices_available) {
                            mdlService.setModelData('devices', simuService.getSimuDevices());
                        }
                        mdlService.setModelData('bluetooth', true);
                        mdlService.setModelData('searching', false);
                        deferred.resolve(mdlService.getModel());
                    }, 2000);
                } else {
                    //real use case
                    mdlService.setModelData('searching', true);
                    mdlService.setModelData('selectedDevice', '');
                    mdlService.setModelData('devices', []);
                    mdlService.setModelData('services', []);
                    ble.startScan([], function (device) {
                        //found a device
                        console.log('HW --> device found: ' + JSON.stringify(device));
                        mdlService.pushIntoModelArray('devices', device);
                        mdlControl.update();
                    }, function () {
                        //failure while searching for a device
                        console.log('HW --> failure while scanning for device.');
                    });
                    setTimeout(ble.stopScan,
                            //todo: this will hang until the timeout is not passed, better would be an advertisement based hangup of the scanning
                            3000,
                            function () {
                                console.log("HW --> Scan complete");
                                mdlService.setModelData('searching', false);
                                deferred.resolve(mdlService.getModel());
                            },
                            function () {
                                console.log("HW --> stopScan failed");
                                mdlService.setModelData('searching', false);
                                deferred.resolve(mdlService.getModel());
                            }
                    );
                }
            } else {
                //bluetooth is not enabled
                mdlService.setModelData('searching', false);
                mdlService.setModelData('bluetooth', false);
                mdlControl.update();
                deferred.resolve(mdlService.getModel());
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
            mdlService.setModelData('searching', false);
            mdlService.setModelData('connected', false);
            mdlService.setModelData('connecting', false);
            //todo: make a prescan
            if (configService.getValue('/blexee/simuMode')) {
                //in simulation mode
                mdlService.setModelData('devices', simuService.getSimuDevices());
            }

            var devices = mdlService.getModelData('devices');
            if (devices) {
                //configure selected device in simu mode
                for (i = 0; i < devices.length; i++) {
                    if (devices[i].id === deviceID) {
                        mdlService.setModelData('connecting', true);
                        mdlService.setModelData('selectedDevice', devices[i]);
                        break;
                    }
                }
                console.log("--> found device to connect to: " + JSON.stringify(mdlService.getModelData('selectedDevice')));
            }

            if (mdlService.getModelData('selectedDevice') !== null && mdlService.getModelData('connecting')) {
                if (configService.getValue('/blexee/simuMode')) {
                    console.log("SIMU :: --> simulating approximation process");
                    if (simuService.getSimuData().can_connect) {
                        simuService.approximationSimuLoop(-100, mdlService.getModel(), mdlControl, function () {
                            mdlService.setModelData('connecting', false);
                            mdlService.setModelData('connected', true);
                            mdlService.setModelData('searching', false);
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
                    mdlService.setModelData('proximity', getPercentFromRssi(rssi));

                    console.log("HW --> BLE device default proximity value: " + mdlService.getModelData('selectedDevice')['proximity'] + " [at rssi: ]" + rssi);
                    mdlControl.update(rssi);
                    approximationLoop(deviceID, function (peripheralObject) {
                        //succeeded
                        // a peripheral object is handed over: https://github.com/don/cordova-plugin-ble-central/tree/a16b1746cba3292e5eb2f2b026cfbd465ea59c5f#peripheral-data
                        mdlService.setModelData('connecting', false);
                        mdlService.setModelData('connected', true);
                        mdlService.setModelData('searching', false);
                        mdlService.setModelData('services', getGattServices(peripheralObject));
                        console.log('HW --> Connection was succesfull; peripheral object: ' + JSON.stringify(peripheralObject));
                        success();
                    }, function (title, text) {
                        //failed
                        console.log("HW --> failed to connect to device [" + title + "] [" + text + "]");
                        failure(new ErrorMessage(title, text));
                    });
                }
            } else {
                console.log("Cannot connect, because there's no selected device [" + mdlService.getModelData('selectedDevice') !== null + "] or not connecting [" + mdlService.getModelData('connecting') + "]");
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
        try {
            console.log("Entering approximation loop with devce id [" + devID + "] // stringified value: [" + JSON.stringify(devID) + "]");
            var aborted = false;
            scanBluetoothHardware(devID).done(function (providedRssi) {
                try {
                    var selectedDevice = mdlService.getModelData('selectedDevice');
                    console.log("proximity [" + selectedDevice.proximity + "] at rssi [" + providedRssi + "]");
                    selectedDevice.proximity = getPercentFromRssi(providedRssi);
                    mdlService.setModelData('selectedDevice', selectedDevice);
                    mdlControl.update(providedRssi);
                    if (providedRssi < configService.getValue('/blexee/connectLimit') && !aborted) {
                        //todo: sometimes the rssi is very high (eg +127), so a double check is needed
                        console.log("HW --> the device is not close enough, rescanning...");
                        setTimeout(function () {
                            if (!cancelApproximation) {
                                approximationLoop(devID, succeeded, failed);
                            } else {
                                cancelApproximation = false;
                            }
                        }, 500);
                    } else {
                        //todo: make a second check here...
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

    this.breakApproximation = function () {
        cancelApproximation = true;
    };

    /**
     * Scan for bluetooth hardware
     * @private
     * @param {type} devID
     * @returns {unresolved}
     */
    function scanBluetoothHardware(devID) {
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
        if (!mdlService.getModelData('connected')) {
            deferred.reject(new ErrorMessage('Device is not connected', 'Before requesting device-services, please connect first a bluetooth low energy device'));
        } else if (!this.bluetoothEnabled()) {
            deferred.reject(new ErrorMessage('Bluetooth is not enabled', 'Before requesting device-services, please enable your bluetooth and connect a bluetooth low energy device'));
        } else {
            mdlService.setModelData('requestingServices', true);
            if (!configService.getValue('/blexee/simuMode')) {
                //real HW use case
                if (mdlService.getModelData('connected') && mdlService.getModelData('selectedDevice')) {
                    //services are already retrieved while connecting and added to the device model
                    mdlService.setModelData('requestingServices', false);
                    mdlControl.update(mdlService.getModel());
                    deferred.resolve();
                } else {
                    deferred.reject(new ErrorMessage('Device is not connected', 'The device is not connected or device services are not recognized.'));
                }
            } else {
                //simulation mode
                setTimeout(function () {
                    if (simuService.getSimuData().services_available) {
                        //deviceModel.services = getGattServices(bigPeripheralObj);
                        mdlService.setModelData('services', getGattServices(simuService.getRealPeripheralObject()));
                    }
                    mdlService.setModelData('requestingServices', false);
                    console.log('SIMU --> triggered service retrieval simulation |devicemodel.services| ' + JSON.stringify(mdlService.getModelData('services')));
                    mdlControl.update(mdlService.getModel());
                    deferred.resolve();
                }, 2000);
            }
        }
        return deferred.promise();
    };


    /**
     * Disconnects from a connected bluetooth low energy device;
     * @returns {undefined} JQuery deferred object to be used with done or fail methods
     */
    this.disconnect = function () {
        var deferred = $.Deferred();
        mdlService.setModelData('searching', false);
        mdlService.setModelData('devices', []);
        mdlService.setModelData('services', []);
        if (!configService.getValue('/blexee/simuMode') && mdlService.getModelData('connected')) {
            ble.isConnected(mdlService.getModelData('selectedDevice')['id'], function () {
                console.log('HW --> Disconnecting from [' + mdlService.getModelData('selectedDevice')['id'] + '].');
                ble.disconnect(mdlService.getModelData('selectedDevice')['id'], function () {
                    //Successfully disconnected
                    console.log('HW --> disconnected');
                    mdlService.setModelData('connecting', false);
                    mdlService.setModelData('connected', false);
                    mdlService.setModelData('selectedDevice', '');
                    deferred.resolve();
                }, function () {
                    deferred.reject(new ErrorMessage('Bluetooth cannot disconnect', 'Generic error received while trying to disconnect from bluetooth device.'));
                });
            }, function () {
                //was not connected
                console.log('HW --> Device [' + mdlService.getModelData('selectedDevice')['id'] + '] was not connected.');
            });
        } else {
            //simu mode
            console.log('SIMU :: --> Disconnecting from [' + mdlService.getModelData('selectedDevice')['id'] + '].');
            mdlService.setModelData('selectedDevice', '');
            deferred.resolve();
        }
        return deferred.promise();
    };

    /**
     * Starts the notification on the bluetooth low energy device. If simulation is started it will use the simu service for a fake 2 byte long notification;
     * @param {type} serviceUuid the uuid of the GATT Service to start the notification on
     * @param {type} characteristicUuid the uuid of the Characteristic of the GATT Service
     * @param {type} onDataCallback the callback method will be called each time the BLE device sends a notification
     * @param {type} failedCallback the callback method called when starting the notification failes
     * @returns {undefined}
     */
    this.startNotification = function (serviceUuid, characteristicUuid, onDataCallback, failedCallback) {
        if (mdlService.getModelData('connected') && mdlService.getModelData('selectedDevice') !== null) {
            if (!configService.getValue('/blexee/simuMode')) {
                ble.startNotification(mdlService.getModelData('selectedDevice')['id'], serviceUuid, characteristicUuid, onDataCallback, failedCallback);
            } else {
                //start notification simulation
                console.log('SIMU :: Start notifications');
                boxService = configService.getValue('/services/box-service');
                if (characteristicUuid === boxService.characteristics['parcel-store']) {
                    simuService.setSimulateNotifications(true);
                    simuService.simulateNotifications(onDataCallback, 0x00);
                } else {
                    simuService.setSimulateNotifications(true);
                    simuService.simulateNotifications(onDataCallback, 0x02);
                }

            }
        }
    };

    /**
     * 
     * @param {type} serviceUuid
     * @param {type} characteristicUuid
     * @param {type} successCallback
     * @param {type} failedCallback
     * @returns {undefined}
     */
    this.stopNotification = function (serviceUuid, characteristicUuid, successCallback, failedCallback) {
        if (mdlService.getModelData('connected') && mdlService.getModelData('selectedDevice') !== null) {
            if (!configService.getValue('/blexee/simuMode')) {
                ble.startNotification(mdlService.getModelData('selectedDevice')['id'], serviceUuid, characteristicUuid, successCallback, failedCallback);
            } else {
                //stop notification simulation
                console.log('SIMU :: Stopping notifications');
                simuService.setSimulateNotifications(false);
            }
        }
    };

    /**
     * 
     * @param {type} serviceUuid
     * @param {type} characteristicUuid
     * @param {type} success
     * @param {type} failure
     * @returns {undefined}
     */
    this.readData = function (serviceUuid, characteristicUuid, success, failure) {
        if (mdlService.getModelData('connected') && mdlService.getModelData('selectedDevice') !== null) {
            if (!configService.getValue('/blexee/simuMode')) {
                ble.read(mdlService.getModelData('selectedDevice')['id'], serviceUuid, characteristicUuid, success, failure);
            } else {
                //stop notification simulation
                console.log('SIMU :: Reading characteristic');
                ab = new Uint8Array(2);
                ab[0] = 0x00;
                ab[1] = 0x19;
                success(ab.buffer);
            }
        }
    };
    /**
     * Write data to a GATT Characteristic found on a GATT service
     * @param {type} serviceUuid the unique ID of the service which contains the characteristic to be updated
     * @param {type} characteristicUuid the unique ID of the characteristics to be updated
     * @param {type} arrayBufferData the data to be written
     * @param {type} success function called once the data writing has succeeded
     * @param {type} failure function called if data could not be written
     * @returns {undefined}
     */
    this.writeData = function (serviceUuid, characteristicUuid, arrayBufferData, success, failure) {
        if (DEBUG) {
            console.log(" -- called write data --> service [%s] characteristic [%s] and data as char array [%s] | byte array size [%s]", serviceUuid, characteristicUuid, bytesToString(arrayBufferData), arrayBufferData.byteLength);
        }
        if (mdlService.getModelData('connected') && mdlService.getModelData('selectedDevice') !== null) {
            if (!configService.getValue('/blexee/simuMode')) {
                ble.isConnected(mdlService.getModelData('selectedDevice')['id'], function () {
                    //todo: make a hexa writer
                    ble.write(mdlService.getModelData('selectedDevice')['id'], serviceUuid, characteristicUuid, arrayBufferData, success, function () {
                        failure(new ErrorMessage("Couldn't write data", "Please make sure that you've wrote data which is acceptable."));
                    });
                }, function () {
                    failure(new ErrorMessage("Device is not connected", "Please make sure that the device is connected first."));
                });
            } else {
                console.log("SIMU :: -- write --> service [%s] characteristic [%s] and data as char array [%s]", serviceUuid, characteristicUuid, bytesToString(arrayBufferData));
                success();
            }
        }
    };

    // ASCII only
    function bytesToString(buffer) {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }

    this.parseHexString = function (str) {
        str = str.replace(/ /g, '');
        if (TRACE) {
            console.log('HEXX PARSER ::: original string [' + str + '] / string length [' + str.length + ']');
        }
        var result = new Uint8Array(str.length / 2);
        var index = 0;
        while (str.length >= 2) {
            result[index] = parseInt(str.substring(0, 2), 16);
            str = str.substring(2, str.length);
            index++;
        }
        if (TRACE) {
            console.log('HEXX PARSER ::: byte length [' + result.byteLength + ']');
            console.log('HEXX PARSER ::: length [' + result.length + ']');
            console.log('buffer bytes to string: ' + bytesToString(result.buffer));
        }
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
                mdlService.setModelData('bluetooth', true);
                deferred.resolve(true);
            }, function () {
                //failure
                console.info('HW :: --> bluetooth is false.');
                mdlService.setModelData('bluetooth', false);
                deferred.resolve(false);
            });
        }
        return deferred.promise();
    };


    /**
     * Extract the GATT services from a JSON data structure (peripheral data), which includes all characteristics
     * A sample can be found here: https://github.com/don/cordova-plugin-ble-central/tree/a16b1746cba3292e5eb2f2b026cfbd465ea59c5f#peripheral-data
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
