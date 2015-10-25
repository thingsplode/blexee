var ConfigurationService = function () {
    var cfgSchemas = [
        {
            "path": "/blexee",
            "text": "Menu",
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
                    "id": "connectLimit",
                    "caption": "Connect Limit",
                    "type": "Numeric",
                    "value": "-51"
                }
            ]
        }
    ];
    this.getValue = function (path) {
        var pathArray = path.split('/');
        if (pathArray.length < 1) {
            return;
        }
        var key = pathArray.pop();
        var schemaPath = pathArray.join('/');
        return cfgSchemas.filter(function (schemaEntry) {
            return schemaEntry.path === schemaPath;
        })[0].keys.filter(function (keyEntry) {
            return keyEntry.id === key;
        })[0].value;
    };
    this.setValue = function (path, value) {
        var pathArray = path.split('/');
        if (pathArray.length < 1) {
            return;
        }
        var key = pathArray.pop();
        var schemaPath = pathArray.join('/');

        for (i = 0; i < cfgSchemas.length; i++) {
            if (cfgSchemas[i].path === schemaPath) {
                for (x = 0; x < cfgSchemas[i].keys.length; x++) {
                    if (cfgSchemas[i].keys[x].id === key) {
                        cfgSchemas[i].keys[x].value = value;
                        console.log('CONFIGURATION ::: ' + JSON.stringify(cfgSchemas));
                        return true;
                    }
                }
            }
        }
        return false;
    };
    this.getConfigSchemas = function () {
        return cfgSchemas;
    };
};