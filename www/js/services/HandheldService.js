/* global StatusBar */
/**
 * Represents the phone or tablet, configures the hardware specific aspects;
 * @returns {undefined}
 */
(function () {
    document.addEventListener('deviceready', function () {
        //if (DEBUG)
        console.log('DEVICE ready');
        console.log(StatusBar);
        //StatusBar.backgroundColorByHexString('#ffffff');
        //StatusBar.styleDefault();
        //StatusBar.styleBlackTranslucent();
        //StatusBar.backgroundColorByName("red");
        StatusBar.styleLightContent();
        StatusBar.overlaysWebView(false);
        StatusBar.backgroundColorByHexString('#4CAF50');
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
