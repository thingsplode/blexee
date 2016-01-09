# blexee
A Bluetooth Low Energy Client Prototype with Apache Cordova (PhoneGap)

In order to install it via XCode, you need to Trust the app
* on the phone: Settings -> General -> Profiles -> Developer App -> Trust

# Required Cordova Plugins
```bash 
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-console
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-vibration
cordova plugin add cordova-plugin-media
cordova plugin add cordova-plugin-dialogs
cordova plugin add cordova-plugin-ios-longpress-fix
cordova plugin add https://github.com/Telerik-Verified-Plugins/Flashlight
cordova plugin add phonegap-plugin-barcodescanner
cordova plugin add cordova-plugin-ble-central
```
Building the solution
```bash
cordova build ios
```

#Enable debugging via Safari

* on the phone: Settings -> Safari -> Advanced -> Web Inspector : turn on;