var ConfigurationService = function (cfgSchema) {
    var SCHEMA_STORAGE_KEY = "config_schemas";
    var dirty = true;
    var self = this;
    
    var functionStore = [];

    $(document).ready(function () {
        $(document).on('change', '.config-field', updateField);
        $(document).on('submit', '.config-field', function (e) {
            e.preventDefault();
        });
    });

    /**
     * 
     * @param {type} event
     * @returns {undefined}
     */
    function updateField(event) {
        event.preventDefault();
        var target = $(event.target),
                root = $(this).attr('data-path'),
                keyId = $(this).attr('data-field-id'),
                triggerType = $(this).attr('data-trigger-type');
        if (triggerType.toUpperCase() === 'INPUT') {
            console.log('EVENT RECEIVED::: ' + root + ':' + keyId + ' value [' + target.val() + '] type [' + target[0].type + ']//Trigger Type[' + triggerType + ']');
            if (target[0].type.toUpperCase() === 'CHECKBOX') {
                console.log('CHECKED STATE:' + target.prop("checked"));
                if (target.prop("checked")) {
                    self.setValue(root + '/' + keyId, true);
                } else {
                    self.setValue(root + '/' + keyId, false);
                }
            }
        } else if (triggerType.toUpperCase() === 'FORM') {
            console.log('EVENT RECEIVED::: ' + root + ':' + keyId + ' value [' + target.val() + '] type [' + target[0].type + ']//Trigger Type[' + triggerType + ']');
            if (target[0].type.toUpperCase() === "TEXT") {
                self.setValue(root + '/' + keyId, target.val());
            }
        }
    }

    /**
     * Register a function to be called when the coresponding setting is changed;
     * @param {type} funcID the unique id of the function which will indentify it during calls 
     * @param {type} path the configuration path (in the form: /superNode/subNode/configurationKey) upon the change the function will be triggered
     * @param {type} func the reference to the function which will be triggered if the configuration key chnages
     * @returns {undefined}
     */
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
    
    /**
     * @private
     * @param {type} path the path for which the triggerable functions should be returned
     * @returns {Array} all configured triggerable functions
     */
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
        window.localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(cfgSchema));
        deferred.resolve();
        return deferred.promise();
    }

    this.reset = function () {

        window.localStorage.removeItem(SCHEMA_STORAGE_KEY);
        window.localStorage.clear();
        console.log('//' + window.localStorage.getItem(SCHEMA_STORAGE_KEY) + '//');
    };

    function loadConfiguration() {
        var deferred = $.Deferred();
        var storedValues = window.localStorage.getItem(SCHEMA_STORAGE_KEY);
        if (storedValues) {
            cfgSchema = JSON.parse(storedValues);
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
        return cfgSchema.filter(function (schemaEntry) {
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
        for (i = 0; i < cfgSchema.length; i++) {
            if (cfgSchema[i].path === schemaPath) {
                for (x = 0; x < cfgSchema[i].keys.length; x++) {
                    if (cfgSchema[i].keys[x].id === key) {
                        cfgSchema[i].keys[x].value = value;
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
        return cfgSchema;
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