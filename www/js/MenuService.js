var MenuService = function() {
    this.initialize = function() {
        // No Initialization required
        var deferred = $.Deferred();
        deferred.resolve();
        return deferred.promise();
    };
    
    this.findAll = function() {
        console.log('MenuService :: findAll');
        var deferred = $.Deferred();
        deferred.resolve(menus);
        return deferred.promise();
    };
    
    var menus = [
        {"id": 1, "menu_name": "BLE Device", "link": "King"},
        {"id": 2, "menu_name": "First Mile", "link": "King"},
        {"id": 3, "menu_name": "Last Mile", "link": "Taylor"},
        {"id": 4, "menu_name": "Settings", "link": "Taylor"},
        {"id": 5, "menu_name": "Service Menu", "link": "Taylor"}
    ];
}; 