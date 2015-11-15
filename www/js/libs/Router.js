var router = (function () {

    "use strict";

    var routes = [];
    var currentRoute;

    /**
     * 
     * @param {type} route the current URL of the browser
     * @param {type} entryHandler the function which will be execute while entering the new address
     * @param {type} exitHandler the function to be executed when leaving this page
     * @returns {undefined}
     */
    function addRoute(route, entryHandler, exitHandler) {
        routes.push({parts: route.split('/'), entryHandler: entryHandler, exitHandler: exitHandler});
    }

    function load(route) {
        window.location.hash = route;
    }

    function start() {
        if (currentRoute && currentRoute.exitHandler) {
            currentRoute.exitHandler();
        }
        var path = window.location.hash.substr(1),
                parts = path.split('/'),
                partsLength = parts.length;

        for (var i = 0; i < routes.length; i++) {
            currentRoute = routes[i];
            if (currentRoute.parts.length === partsLength) {
                var params = [];
                for (var j = 0; j < partsLength; j++) {
                    if (currentRoute.parts[j].substr(0, 1) === ':') {
                        params.push(parts[j]);
                    } else if (currentRoute.parts[j] !== parts[j]) {
                        break;
                    }
                }
                if (j === partsLength) {
                    currentRoute.entryHandler.apply(undefined, params);
                    return;
                }
            }
        }
    }

    $(window).on('hashchange', start);

    return {
        addRoute: addRoute,
        load: load,
        start: start
    };

}());