var sys = require('sys'),
_inspect = sys.inspect,
_debug = sys.debug;

exports.debug = function debug() {
    for (var arg in arguments) {
    	if (typeof arguments[arg] === "object") {
        	_debug("[object]\n" + _inspect(arguments[arg]));
        } else {
        	_debug("[" + typeof arguments[arg] + ']\n' + arguments[arg]);
        }
    }
};


/**
 * File/dir watcher and restart manager for development (inspired http://github.com/defrex/node.devserver.js).
 * @todo add crash detect
 */
var fs = require('fs'),
spawn = require('child_process').spawn,
server,
startup_script = null,
closed = false;

var lib_dir = __dirname.split('/');
lib_dir = lib_dir.slice(0, lib_dir.length - 1).join('/');

var start_server = function(script) {
    script && watch(lib_dir);
    startup_script = startup_script || script;
    sys.puts("Run child process: node " + startup_script + " dev");
    server = spawn('node', [startup_script, "dev"]);
    closed = false;
    var pass_along = function(data) { ! data || sys.print(data);
    };
    server.stdout.addListener('data', pass_along);
    server.stderr.addListener('data', pass_along);
    server.addListener("exit",
    function() {
        sys.puts("child process exits: " + arguments[0]);
        closed = true;
        start_server();
    });
    sys.puts('server started');
};

var restart_server = function() {
    sys.puts('change discovered, restarting server');
    if (!closed) {
        // child process, called watch directly
        server ? server.kill() : process.exit(0);
    }
};

var parse_file_list = function(dir, files) {
    for (var i = 0; i < files.length; i++) { (function() {
            var file = dir + '/' + files[i];
            fs.stat(file, function(err, stats) {
                if (stats.isDirectory()) {
                    fs.readdir(file, function(err, files) {
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


function watch(path) {
    sys.puts("Start watching directory: " + path);
    fs.readdir(path, function(err, files) {
        parse_file_list(path, files);
    });
}

exports.run = start_server;
exports.watchDir = watch;


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
    global.d = debug;
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
