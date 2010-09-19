/**
 * Benchmark helper functions
 */


// log to console
var log = console.log;

/**
 * Build a benchmark function from the given functions.
 *
 * @param {String} name Name of your benchmark
 * @param {Array} func Array of functions which you want to compare
 * @return {Function} Benchmark function can run the benchmark as many times as you need by putting a number as the first argument.
 */
function create(name, funs) {
    return function(times) {
        log("Start running %d times of benchmark: %s\n", times, name);
        for (var i in funs) {
           var count = times, fn = funs[i], start = +new Date;
            while(count--) {
                fn();
            }
            log('%d: %s', i, (+new Date - start) + ' ms');
        }
    }
}

module.exports = {
    create: create
}