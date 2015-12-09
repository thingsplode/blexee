var cfgSchema = [
    {
        "path": "/blexee",
        "caption": "General Config",
        "display": true,
        "keys": [
            {
                "id": "simuMode",
                "caption": "Simulation",
                "type": "Boolean",
                "valueset": ["Simulation", "Real"],
                "value": true
            },
            {
                "id": "debugMode",
                "caption": "Debug Mode",
                "type": "Boolean",
                "value": true
            },
            {
                "id": "traceMode",
                "caption": "Trace Mode",
                "type": "Boolean",
                "value": true
            },
            {
                "id": "connectLimit",
                "caption": "Connect Limit",
                "type": "Numeric",
                "value": "-51"
            }
        ]
    },
    {
        "path": "/services",
        "caption": "Connectable Services",
        "display": false,
        "keys": [
            {
                "id": "box-service",
                "caption": "The Locker Manager Service",
                "type": "Object",
                "value": {"uuid": "8fad8bdd-d619-4bd9-b3c1-816129f417ca",
                    "characteristics": {
                        "parcel-store": "f76e76fc-a36a-49ab-85d3-9ac389b12ef8",
                        "parcel-release": "e8dbd220-6391-4498-a19b-33adb3543a33"
                    }
                }
            },
            {
                "id": "system",
                "caption": "System Monitoring Service",
                "type": "Object",
                "value": {"uuid": "5d2ade4e-5f83-4c49-b5c9-8d9e2f9db41a",
                    "characteristics": {
                        "memory-percentage": "b03eef61-bce5-4849-aaa3-9cc5f652cf03",
                        "cpu-percentage": "b0cf5f03-e079-4c77-8e1b-7763e734e5f4"
                    }
                }
            },
            {
                "id": "io-service",
                "caption": "IO Automation Service",
                "type": "Object",
                "value": {"uuid": "1815",
                    "characteristics": {"automation-io": "2A56", "pickup": "2a01"
                    }
                }
            }
        ]
    },
    {
        "path": "/device",
        "caption": "Devices Related",
        "display": true,
        "keys": [
            {
                "id": "connectable-deviceUuid",
                "caption": "UUID of connectable device",
                "type": "Label",
                "value": "291C9A2E-CCA3-1EF0-5C5C-E19E29973F16"
            },
            {
                "id": "disconnectWait",
                "caption": "Wait time before disconnect",
                "type": "Numeric",
                "value": "2500"
            }
        ]
    }
];
