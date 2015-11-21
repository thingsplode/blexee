/**
 * The configuration service provides:<br>
 * <ul>
 * <li> a persistent configuration store for an arbitrary config schema (json object)
 * <li> register-able functions which will be called upon changing the value of configuration keys
 * <li> observer for widgets (once a widget status is changed, it will change the value of the attached variable)
 * </ul>
 * The configuration will be persisted on the local storage within the user's browser;
 * @param {type} cfgSchema the structure of the config schema must be:
 * [{"path": "/some_path","caption": "General Config","keys": [{"id": "someConfigId","caption": "Some Caption Text","type": "Boolean","valueset": ["True", "False"],"value": true}}]
 * @returns {ConfigurationService}
 */
var ConfigurationService = function (cfgSchema) {
    var SCHEMA_STORAGE_KEY = "config_schemas";
    var dirty = true;
    var self = this;

    var functionStore = [];
    //initializer: once an element with config-field class is changed, the updateField function is called
    $(document).ready(function () {
        $(document).on('change', '.config-field', updateField);
        $(document).on('submit', '.config-field', function (e) {
            e.preventDefault();
        });
    });

    /**
     * Updates a value within the configuration schema at the following path: /some_path/some_key_id;
     * The form which triggers the change event has to have the following attributes:
     * <ul>
     * <li> data-path: the path name within the configuration scheme to which the key-id belongs to;
     * <li> data-key-id: the id of the key, which value needs to be changed;
     * <li> data-trigger type: INPUT or FORM, depending on the structure (in case there's an input html tag within a lable or other element, this value will be set to INPUT on the input tag; otherwise, if the event comes from a form tag, the form tag should have the data-trigger-type: FORM;
     * </ul>
     * @private
     * @param {type} event
     * @returns {undefined}
     */
    function updateField(event) {
        event.preventDefault();
        var target = $(event.target),
                path = $(this).attr('data-path'),
                keyId = $(this).attr('data-key-id'),
                triggerType = $(this).attr('data-trigger-type');
        console.log('EVENT RECEIVED::: ' + path + ':' + keyId + ' value [' + target.val() + '] type [' + target[0].type + ']//Trigger Type[' + triggerType + ']');
        if (triggerType.toUpperCase() === 'INPUT') {
            if (target[0].type.toUpperCase() === 'CHECKBOX') {
                console.log('CHECKED STATE:' + target.prop("checked"));
                if (target.prop("checked")) {
                    self.setValue(path + '/' + keyId, true);
                    target.prop("checked", true);
                } else {
                    self.setValue(path + '/' + keyId, false);
                    target.prop("checked", false);
                }
            }
        } else if (triggerType.toUpperCase() === 'FORM') {
            if (target[0].type.toUpperCase() === "TEXT") {
                self.setValue(path + '/' + keyId, target.val());
                target[0].blur();
            }
        }
    }

    /**
     * Register a function to be called when the coresponding keyid value is changed on the path;
     * @param {type} funcID the unique id of the function which will indentify it during calls 
     * @param {type} path the configuration path (in the form: /some_path/configurationKeyId) upon the change the function will be triggered
     * @param {type} func the reference to the function which will be triggered if the configuration key changes
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
     * Retrieve all functions which are registered for one configuration schema path, like /some_path/some_key_id
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

    /**
     * Save the current configuration schema alltogether with the current values in the localStorage
     * @private
     * @returns {unresolved}
     */
    function save() {
        var deferred = $.Deferred();
        window.localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(cfgSchema));
        deferred.resolve();
        return deferred.promise();
    }

    /**
     * Deletes the values of (resets) the configuration schema
     * @private
     * @returns {undefined}
     */
    this.reset = function () {
        window.localStorage.removeItem(SCHEMA_STORAGE_KEY);
        window.localStorage.clear();
        console.log('//' + window.localStorage.getItem(SCHEMA_STORAGE_KEY) + '//');
    };

    /**
     * Loads the initial configuration from the local storage
     * @private
     * @returns {unresolved}
     */
    function loadConfiguration() {
        var deferred = $.Deferred();
        var storedValues = window.localStorage.getItem(SCHEMA_STORAGE_KEY);
        if (storedValues) {
            cfgSchema = JSON.parse(storedValues);
        }
        deferred.resolve();
        return deferred.promise();
    }

    /**
     * Gets the value for of a configuration key id, identified by the full path (/some_path/someConfigKeyId)
     * @param {type} path
     * @returns {undefined}
     */
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

    /**
     * Sets the value for of a configuration key id, identified by the full path (/some_path/someConfigKeyId)
     * @param {type} path - the full path (/some_path/someConfigKeyId)
     * @param {type} value - the value to be stored
     * @returns {Boolean} true if the configuration key was found and the value could be stored
     */
    this.setValue = function (path, value) {
        var pathArray = path.split('/');
        if (pathArray.length < 1) {
            return false;
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
    
    /**
     * 
     * @returns the config schema
     */
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