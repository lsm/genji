

var defaultDiffFormat = [
    [60*1000, 'sec'],
    [3600*1000, 'min'],
    [24*3600*1000, 'hour'],
    [30*24*3600*1000, 'day'],
    [365*24*3600*1000, 'mon'],
    [2*365*24*3600*1000, 'year']
];


function formatDiffResult(diff, matchedFormat) {
    diff = diff/1000;
    switch(matchedFormat[1]) {
        case 'sec':
            return [Math.round(diff), 'sec'];
        case 'min':
            return [Math.round(diff/60), 'min'];
        case 'hour':
            return [Math.round(diff/3600), 'hour'];
        case 'day':
            return [Math.round(diff/24/3600), 'day'];
        case 'mon':
            return [Math.round(diff/30/24/3600), 'mon'];
        case 'year':
            return [Math.round(diff/365/24/3600), 'year'];
        default:
            return [Math.round(diff/24/3600), 'day'];
    }
}

var Datetime = function(options) {
    options = options || {};
    this.diffFormat = options.diffFormat || defaultDiffFormat;
}

Datetime.prototype.diff = function(date1, date2, format) {
    if (Array.isArray(date2) && !format) {
        format = date2;
        date2 = undefined;
    }
    if (!date2) {
        // default to `now`
        date2 = new Date;
    }
    format = format || this.diffFormat;
    var diff = Math.abs(date2 - date1);
    for (var i = 0, len = format.length; i < len; i++) {
       if (diff <= format[i][0]) {
            return formatDiffResult(diff, format[i]);
        }
    }
    // return the original date if not in range
    return date1;
};


module.exports = Datetime;