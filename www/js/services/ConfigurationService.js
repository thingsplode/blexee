var ConfigurationService = function () {
    var cfgSchemas = [
        {
            "id": "blexee",
            "path": "/blexee",
            "text": "Menu",
            "keys": [
                {
                    "id": "simuMode",
                    "caption": "Simulation",
                    "type": "Boolean",
                    "valueset": ["Simulation", "Real"],
                    "value": "true"
                },
                {
                    "id": "debugMode",
                    "caption": "Debug Mode",
                    "type": "Boolean",
                    "value": "true"
                },
                {
                    "id": "connectLimi",
                    "caption": "Connect Limit",
                    "type": "Numeric",
                    "value": "-51"
                }
            ]
        }
    ];

    this.getConfigSchemas = function () {
        return cfgSchemas;
    };
};