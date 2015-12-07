function ErrorMessage(title, message) {
    this.title = title;
    this.message = message;
}

function RequestMessage() {
}

var ParcelAction = {
    STORED: 0,
    RELEASED: 1
};

ParcelActionRequest.prototype = new RequestMessage();
ParcelActionRequest.prototype.constructor = ParcelActionRequest;
function ParcelActionRequest(parcelAction, barcode, slotID) {
    this.parcelAction = parcelAction;
    this.barcode = barcode;
    this.slotID = slotID;
}

var ResponseCode = {
    OK:200,
    CREATED:201,
    ACCEPTED:202,
    BAD_REQUEST:400,
    UNAUTHORIZED:401,
    PAYMENT_REQUIRED:402,
    NOT_FOUND:404,
    REQUEST_TIMEOUT:408,
    INTERNAL_ERROR:500,
    NOT_IMPLEMENTED:501,
    SERVICE_UNAVAILABLE:503,
    GW_TIMEOUT:504
};

function ResponseMessage(responseCode, responseMsg) {
    this.responseCode = responseCode;
    this.responseMsg = responseMsg;
}

function Notification() {
}
ParcelNotification.prototype = new Notification();
ParcelNotification.prototype.constructor = ParcelNotification;
function ParcelNotification(parcelAction, barcode, slotID) {
    this.parcelAction = parcelAction;
    this.barcode = barcode;
    this.slotID = slotID;
    this.processed = false;
}