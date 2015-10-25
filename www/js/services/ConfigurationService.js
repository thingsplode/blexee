var ConfigurationService = function () {
    var SCHEMA_STORAGE_KEY = "config_schemas";
    var dirty = true;
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
                    "value": false
                },
                {
                    "id": "traceMode",
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
    var functionStore = [];
    this.registerTriggerableFunction = function (funcID, path, func) {
        found = false;
        if (functionStore.length > 0) {
            for (i = 0; i < functionStore.length; i++) {
                if (functionStore[i].funcID === funcID) {
                    functionStore[i].path = path;
                    functionStore[i].func = func;
                    return;
                }
            }
        } else if (functionStore.length === 0 || !found) {
            functionStore.push(new TriggerableFunction(funcID, path, func));
        }
    };
    function getFunctions(path) {
        if (functionStore.length > 0) {
            return functionStore.filter(function (funcEntry) {
                return funcEntry.path === path;
            });
        } else {
            return [];
        }
    }

    function save() {
        var deferred = $.Deferred();
        window.localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(cfgSchemas));
        deferred.resolve();
        return deferred.promise();
    }

    function loadConfiguration() {
        var deferred = $.Deferred();
        var storedValues = window.localStorage.getItem(SCHEMA_STORAGE_KEY);
        if (storedValues) {
            cfgSchemas = JSON.parse(storedValues);
        }
        deferred.resolve();
        return deferred.promise();
    }

    this.getValue = function (path) {
        if (dirty) {
            loadConfiguration().done(function () {
                dirty = false;
            });
        }
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
                        //console.log('CONFIGURATION ::: ' + JSON.stringify(cfgSchemas));
                        save();
                        var triggerableFunctions = getFunctions(path);
                        if (triggerableFunctions.length > 0) {
                            triggerableFunctions.forEach(function (element, index, array) {
                                element.call(value);
                            });
                        }
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

    TriggerableFunction.prototype.call = function (value) {
        var deferred = $.Deferred();
        this.func(value);
        deferred.resolve();
        return deferred.promise();
    };
};

var TriggerableFunction = function (funcID, path, func) {
    this.funcID = funcID;
    this.path = path;
    this.func = func;
};