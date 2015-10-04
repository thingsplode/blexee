var GattService = function() {
    this.initialize = function() {
        // No Initialization required
        var deferred = $.Deferred();
        deferred.resolve();
        return deferred.promise();
    };
    
    this.findAll = function() {
        console.log('GattService :: findAll');
        var deferred = $.Deferred();
        deferred.resolve(menus);
        return deferred.promise();
    };
    
    var menus = [
        {"id": 1, "uuid": "123456", "primary": "true","Characteristics":[
                {"uuid":"1234","flags":"read","User Descriptor":"Some Description"},
                {"uuid":"2334","flags":"write","User Descriptor":"Some Other Description"},
                {"uuid":"3334","flags":"notify","User Descriptor":"Yet Another Description"},
            ]},
        {"id": 2, "uuid": "223456", "primary": "true","Characteristics":[{"uuid":"2345","flags":"read","User Descriptor":"A Description"}]},
        {"id": 3, "uuid": "323456", "primary": "true","Characteristics":[{"uuid":"2346","flags":"write","User Descriptor":"Another Description"}]},
        {"id": 4, "uuid": "423456", "primary": "true","Characteristics":[{"uuid":"1345","flags":"read","User Descriptor":"So more Description"}]},
        {"id": 5, "uuid": "523456", "primary": "true","Characteristics":[{"uuid":"989p","flags":"read","User Descriptor":"Some Description"}]},
    ];
}; 