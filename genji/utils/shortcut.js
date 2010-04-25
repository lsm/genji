
// 'genji' as top level namespace
function lv1(dev) {
    if (!global.hasOwnProperty("genji")) {
        dev && forDev();
        global.genji = require("../../genji");
    } else {
        throw new Error("Namespace conflicts or you've called me twice.");
    }
}

// level one + merge packages with global
function lv2(dev) {
    lv1(dev);
    global.core = genji.core;
    global.crypto = genji.crypto;
    global.utils = genji.utils;
    global.web = genji.web;
}

// level one + merge common classes with global
function lv3(dev) {
    lv1(dev);
    global.Base = genji.core.Base;
    global.Event = genji.core.Event;
}

// handy functions for development
function forDev() {
    global.d = require("./index").debug;
}

exports.setLevel = function(lv, dev) {
    switch(lv) {
        case 1:
            lv1(dev); break;
        case 2:
            lv2(dev); break;
        case 3:
            lv3(dev); break;
        default:
            break;
    }
}
