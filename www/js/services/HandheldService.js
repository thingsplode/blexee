/* global StatusBar, TRACE, DEBUG, cordova */
/**
 * Represents the phone or tablet, configures the hardware specific aspects;
 * @returns {undefined}
 */
(function () {



    document.addEventListener('deviceready', function () {
        if (TRACE) {
            console.log('status bar status: %s', StatusBar);
        }
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

        var tocSoundFile = 'assets/Tock.mp3', tocSound = new Media(tocSoundFile, function () {
            if (DEBUG) {
                console.log('MEDIA :: audio success.');
            }
        }, function (err) {
            console.log('ERROR :: %s', JSON.stringify(err));
        });
        tocSound.setVolume('1.0');


        $(document).on('click', '.btn', function () {
            if (tocSound) {
                tocSound.play();
            } else {
                console.log('WARNING: tocSound is not defined.');
            }
        });


        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        DEVICE_PRESENT = true;
        console.log('DEVICE ready and configured...');
    }, false);
}());
