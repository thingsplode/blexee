/* global Handlebars, TRACE */

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
    if (!percentage || percentage === '' || isNaN(percentage)){
        percentage = 0;
    }
    var absolut = percentage * max / 100;
    return new Handlebars.SafeString(absolut);
});

Handlebars.registerHelper('sanitize_number', function (value) {
    if (!value || value === '' || isNaN(value)){
        value = 0;
    }
    return new Handlebars.SafeString(value);
});

Handlebars.registerHelper('json', function (obj) {
    return JSON.stringify(obj);
});

Handlebars.registerHelper('each_when', function (list, k, v, opts) {
    var i, result = '';
    for (i = 0; i < list.length; ++i)
        if (list[i][k] === v)
            result = result + opts.fn(list[i]);
    return result;
});

Handlebars.registerHelper('each_when_not', function (list, k, v, opts) {
    var i, result = '';
    for (i = 0; i < list.length; ++i)
        if (list[i][k] !== v)
            result = result + opts.fn(list[i]);
    return result;
});
/**
 * Used to generate data fields
 */
Handlebars.registerHelper('generate_field', function (id, type, currentValue, valueSet, path) {
//    var id = Handlebars.Utils.escapeExpression(this.id),
//            type = Handlebars.Utils.escapeExpression(this.type),
//            currentValue = Handlebars.Utils.escapeExpression(this.value),
//            valueSet = Handlebars.Utils.escapeExpression(this.valueset);
    if (TRACE) {
        console.log('CALLED HELPER -> id: [' + id + '] tyep: [' + type + '] // [' + type.toUpperCase() + '] currentValue: [' + currentValue + '] valueset: [' + valueSet + ']');
    }
    var fieldContent = null;
    if (type.toUpperCase() === 'BOOLEAN') {
        fieldContent = "<label class=\"mdl-switch mdl-js-switch mdl-js-ripple-effect\" for=\"" + id + "\">" +
                "<input type=\"checkbox\" id=\"" + id + "\" class=\"mdl-switch__input config-field\" data-trigger-type=\"INPUT\" data-path=\"" + path + "\"" + (currentValue === true ? "checked" : "") + " data-key-id=\"" + id + "\" />" +
                "<span class=\"mdl-switch__label\"></span>" +
                "</label>";

    } else if (type.toUpperCase() === 'NUMERIC') {
        fieldContent = "<form action=\"\" class=\"config-field\" data-trigger-type=\"FORM\" data-path=\"" + path + "\" data-key-id=\"" + id + "\">" +
                "<div class=\"mdl-textfield mdl-js-textfield shorter\">" +
                "<input class=\"mdl-textfield__input\" type=\"text\" pattern=\"-?[0-9]*(\.[0-9]+)?\" id=\"" + id + "\" />" +
                "<label class=\"mdl-textfield__label\" for=\"" + id + "\">" + (currentValue ? currentValue : "Negative Number...") + "</label>" +
                "<span class=\"mdl-textfield__error\">Input is not a number!</span>" +
                "</div>" +
                "</form>";
    } else {
        fieldContent = new Handlebars.SafeString(currentValue);
    }

    return new Handlebars.SafeString(fieldContent);
});