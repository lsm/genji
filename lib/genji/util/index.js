
// https://github.com/kwhinnery/Helium/raw/master/Resources/helium.js
var empty = {};
function mixin(/*Object*/ target, /*Object*/ source){
    var name, s, i;
    for(name in source){
        if (source.hasOwnProperty(name)) {
            s = source[name];
            if(!(name in target) || (target[name] !== s && (!(name in empty) || empty[name] !== s))){
                target[name] = s;
            }
        }
    }
    return target; // Object
};
var extend = function(/*Object*/ obj, /*Object...*/ props){
    if(!obj){
        obj = {};
    }
    for(var i=1, l=arguments.length; i<l; i++){
        mixin(obj, arguments[i]);
    }
    return obj; // Object
};


module.exports = {
    base64: {
        encode: function(input, inputEncoding) {
            var buf = new Buffer(input, inputEncoding || 'utf8');
            return buf.toString('base64');
        },

        //  method for decoding
        decode: function(input, outputEncoding) {
            var base64 = new Buffer(input, 'base64');
            return base64.toString(outputEncoding || 'utf8');
        }
    },
    crypto: require('./crypto'),
    benchmark: require('./benchmark'),
    extend: extend
}