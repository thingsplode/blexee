var SimuService = function (configService) {

    var simuData = {
        'bluetooth_enabled': true,
        'devices_available': true,
        'can_connect': true,
        'services_available': true
    };

    this.getSimuData = function () {
        return simuData;
    };

    this.getSimuDevices = function () {
        return simuDevices;
    };

    this.getWrongGattServices = function () {
        return wrongGattServices;
    };

    this.getRealPeripheralObject = function () {
        return peripheralObjectReal;
    };

    this.getBigPeripheralObj = function () {
        return bigPeripheralObj;
    };

    /**
     *
     * @param {type} i loop count (should be -100)
     * @param {type} deviceModel the model whihc contains all the devices
     * @param {type} modelControl the model control which needs to be updated
     * @param {type} finished finish method
     * @returns {undefined}
     */
    this.approximationSimuLoop = function myself(i, deviceModel, modelControl, finished) {
        setTimeout(function () {
            var x = 100 - (i * -1);
            console.log("SIMU --> proximity value: " + x + " [at rssi: ]" + i);
            deviceModel.selectedDevice.proximity = x;
            modelControl.update(i);
            i++;
            if (i < 0) {
                myself(i, deviceModel, modelControl, finished);
            } else {
                console.log(" ---> " + JSON.stringify(finished));
                finished();
            }
        }, 20);
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
        {"name": "Some Other Device", "id": "291C9A2E-CCA3-1EF0-5C5C-E19E29973F16", "rssi": -79, "advertising": {
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
                {"uuid": "0x2A00", "flags": "read, write", "descriptor": "device_name"},
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
                    "Read", "Write", "Notify"
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