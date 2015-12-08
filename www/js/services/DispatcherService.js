/* global ParcelActionRequest, ParcelAction*/

/**
 * External communciation service
 * @param {type} configService
 * @returns {undefined}
 */
var DispatcherService = function (configService, dataModelService) {
    var NOTIFICATION_STORAGE_KEY = "notifications",
            cfgService = configService,
            nqString = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY),
            notificationQueue = nqString ? JSON.parse(nqString) : [];

    dataModelService.setModelData('notificationQueueSize', notificationQueue.length);

    this.sendMessage = function (message) {
        if (message instanceof ParcelActionRequest) {
            if (message.parcelAction === ParcelAction.STORED) {
                this.storeNotification(message);
            }
        } else {
            console.log('WARNING --> unimplemented message handler for message: ' + JSON.stringify(message));
        }
    };

    this.storeNotification = function (notification) {
        notificationQueue.push(new ParcelNotification(notification.parcelAction, notification.barcode, notification.slotID));
        window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notificationQueue));
        dataModelService.setModelData('notificationQueueSize', notificationQueue.length);
    };

    this.takeNextNotification = function () {
        notification = notificationQueue.length > 0 ? notificationQueue.shift() : null;
        if (notification) {
            window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notificationQueue));
        }
        return notification;
    };
};

