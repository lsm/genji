
// exports submodules and functions
var misc = require('./misc');
module.exports = {
    Base: require('./base'),
    Pool: require('./pool'),
    control: require('./control'),
    math: require('./math'),
    Cache: require('./cache'),
    Factory: require('./factory'),
    extend: misc.extend,
    toArray: misc.toArray
}