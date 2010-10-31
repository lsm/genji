
/**
 * Get a random number between min and max
 * From [MDC-Math.random](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Math/random)
 *
 * @param {Number} min
 * @param {Number} max
 * @param {Boolen} forceInt
 * @return {Number}
 */
exports.random = function(min, max, forceInt) {
    // return int by default
    if (forceInt === undefined) forceInt = true;
    return (forceInt ? Math.floor(Math.random() * (max - min + 1)) : Math.random() * (max - min)) + min;
}