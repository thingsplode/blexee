/* global StatusBar */

(function () {
    document.addEventListener('deviceready', function () {
        console.log(StatusBar);
        //StatusBar.backgroundColorByHexString('#ffffff');
        //StatusBar.styleDefault();
        //StatusBar.styleBlackTranslucent();
        //StatusBar.backgroundColorByName("red");
        StatusBar.styleLightContent();
        StatusBar.overlaysWebView(false);
        StatusBar.backgroundColorByHexString('#3F51B5');
        FastClick.attach(document.body);

        if (navigator.notification) { // Override default HTML alert with native dialog
            window.alert = function (message) {
                navigator.notification.alert(
                        message, // message
                        null, // callback
                        "Blexee", // title
                        'OK'        // buttonName
                        );
            };
        }
        //alert('device ready');
        DEVICE_PRESENT = true;
    }, false);
}());