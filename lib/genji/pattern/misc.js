

function toArray(obj){
    var len = obj.length,
    arr = new Array(len);
    for (var i = 0; i < len; ++i) {
        arr[i] = obj[i];
    }
    return arr;
}

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


exports.extend = extend;
exports.toArray = toArray;