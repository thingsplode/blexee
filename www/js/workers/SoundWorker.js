/* global DEBUG */

var tocSoundFile = 'assets/Tock.mp3', tocSound = new Media(tocSoundFile, function () {
    if (DEBUG) {
        console.log('MEDIA :: audio success.');
    }
}, function (err) {
    console.log('ERROR :: %s', JSON.stringify(err));
});

tocSound.setVolume('1.0');


this.onmessage = function (data) {
    console.log('Sound Worker :: message posted.');
    if (tocSound) {
        tocSound.play();
    } else {
        console.log('WARNING: tocSound is not defined.');
    }
};