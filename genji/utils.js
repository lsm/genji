var sys = require('sys');

exports.dump = function() {
    for (var arg in arguments) {
        sys.debug("[" + typeof arguments[arg] + ']\n' + sys.inspect(arguments[arg], false, null));
    }
};

exports.optionParse = function optionParse(key) {
    // @todo cmd options parser
    var idx;
    if ((idx = process.argv.indexOf(key)) !== -1) {
        return process.argv[idx];
    }
    return false;
}


/**
 * File/dir watcher and restart manager for development (inspired http://github.com/defrex/node.devserver.js).
 * @todo add crash detect, close child process when main exited.
 */
var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn,
server,
startup_script,
closed = false;

var lib_dir = __dirname.split('/');
lib_dir = lib_dir.slice(0, lib_dir.length - 1).join('/');

var run_script = function(script, watch) {
    watch && script && watchDir(lib_dir);
    var node = process.argv[0];
    startup_script = startup_script || script;
    sys.puts("Run child process: " + node + " " + startup_script);
    server = spawn(node, [startup_script]);
    closed = false;
    var pass_along = function(data) {
        data && sys.puts(data);
    };
    server.stdout.addListener('data', pass_along);
    server.stderr.addListener('data', pass_along);
    server.addListener("exit",
        function(code) {
            sys.puts("child process exits: " + code);
            closed = true;
            run_script();
        });
    sys.puts('server started');
};

function run_server(settings) {
    exports.setLevel(settings.level || 1, settings.debug);
    genji.settings = settings;
    var appDir = path.dirname(process.mainModule.filename);
    if (exports.optionParse('rundev')) {
        watchDir(appDir);
        run_script(path.join(appDir, 'start.js'), true);
    } else {
        // Not in development mode, start server directly
        var urls = typeof settings.urls === 'string' ? require(path.join(appDir, settings.urls)) : settings.urls;
        var handlerClass = typeof settings.handler === 'string' ? eval(settings.handler) : settings.handler;
        genji.servers = [genji.web.run(urls, handlerClass, settings.servers[0])];
    }
}

/**
 * restart server whitout exit the process
 *
function restart_server2() {
    genji.server.addListener('close', function() {
        var manage = 'genji.server = web.run(genji.apps, genji.web.handler.SimpleHandler, {port: 8000});';
        process.compile(manage, 'manage.js');
    });
    genji.server.close();
}
*/

var restart_server = function() {
    sys.puts('change discovered, restarting server');
    if (!closed) {
        // child process, called by watch->parse_file_list directly
        server ? server.kill() : process.exit(0);
    }
};

var parse_file_list = function(dir, files) {
    for (var i = 0; i < files.length; i++) {
        (function() {
            var file = dir + '/' + files[i];
            fs.stat(file, function(err, stats) {
                if (err) throw err;
                if (stats.isDirectory()) {
                    fs.readdir(file, function(err, files) {
                        if (err) throw err;
                        parse_file_list(file, files);
                    });
                } else if (stats.isFile()) fs.watchFile(file,
                    function(curr, prev) {
                        if (curr.mtime.toString() !== prev.mtime.toString()) {
                            restart_server();
                            sys.puts("File: " + file + " " + "changed at: " + curr.mtime.toLocaleTimeString());
                        }
                    });
            });
        })();
    }
};


function watchDir(path) {
    sys.puts("Start watching directory: " + path);
    fs.readdir(path, function(err, files) {
        if (err) throw err;
        parse_file_list(path, files);
    });
}

exports.run_server = run_server;
exports.watchDir = watchDir;


// Shortcuts

// 'genji' as top level namespace
function lv1(dev) {
    if (!global.hasOwnProperty("genji")) {
        dev && forDev();
        global.genji = require("../genji");
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
    global.dump = exports.dump;
}

exports.setLevel = function(lv, dev) {
    switch(lv) {
        case 1:
            lv1(dev);
            break;
        case 2:
            lv2(dev);
            break;
        case 3:
            lv3(dev);
            break;
        default:
            lv1(dev);
            break;
    }
}

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/

;(function () {
    // private property
    var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    // public method for encoding
    function encode(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = _utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);

        }

        return output;
    }

    // public method for decoding
    function decode(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = _utf8_decode(output);

        return output;

    }

    // private method for UTF-8 encoding
    function _utf8_encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    };

    // private method for UTF-8 decoding
    function _utf8_decode(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    };
    exports.base64 = {
        'encode': encode,
        'decode': decode,
        'encodeUTF8': _utf8_encode,
        'decodeUTF8': _utf8_decode
    }
})();