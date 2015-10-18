/* global Handlebars */

Handlebars.registerHelper('search', function () {
    return new Handlebars.SafeString(
            "<div class=\"mdl-progress mdl-js-progress mdl-progress__indeterminate\"></div><div class=\"title\">Searching...</div>"
            );
});

Handlebars.registerHelper('device_list', function () {
    deviceId = Handlebars.Utils.escapeExpression(this.id);
    name = Handlebars.Utils.escapeExpression(this.name);
    localName = Handlebars.Utils.escapeExpression(this.advertising.kCBAdvDataLocalName);
    
    return new Handlebars.SafeString(
            "<div class=\"device-card mdl-card mdl-shadow--2dp right\">" +
            "<div class=\"mdl-card__title mdl-card--expand\">" +
            "<h4>" +
            name + "<br>" +
            localName + "<br>" +
            "</h4>" +
            "</div>" +
            "<div class=\"mdl-card__actions mdl-card--border\">" +
            "<a class=\"mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect\" href=\"#connect/" + deviceId + "\">" +
            "Connect" +
            "</a>" +
            "<div class=\"mdl-layout-spacer\"></div>" +
            "<i class=\"material-icons\">flight_takeoff</i>" +
            "</div>" +
            "</div>"
            );
});

Handlebars.registerHelper('absolut_from_percentage', function (percentage, max) {
    var absolut = percentage*max/100;
    return new Handlebars.SafeString(absolut);
});

