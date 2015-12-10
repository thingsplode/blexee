/* global ParcelActionRequest, ParcelAction*/

/**
 * External communciation service
 * @param {ConfigurationService} configService
 * @param {DataModelService} name dataModelService 
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
        dataModelService.updateControl();
    };

    this.pollNotification = function () {
        return notificationQueue.length > 0 ? notificationQueue[0] : null;
    };

    this.removeNotification = function () {
        notification = notificationQueue.length > 0 ? notificationQueue.shift() : null;
        if (notification) {
            window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notificationQueue));
        }
        dataModelService.setModelData('notificationQueueSize', notificationQueue.length);
        dataModelService.updateControl();
        return notification;
    };
};

