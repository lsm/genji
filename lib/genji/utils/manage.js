/**
 * Forked from http://github.com/defrex/node.devserver.js
 * @todo add crash detect, show relative dir
 */

var fs = require('fs'),
sys = require('sys'),
server,
startup_script = null,
closed = false;

var lib_dir = __dirname.split('/');
lib_dir = lib_dir.slice(0, lib_dir.length - 1).join('/');

var start_server = function(script) {
    script && watch(lib_dir);
    startup_script = startup_script || script;
    sys.puts("Run child process: node " + startup_script + " dev");
    server = process.createChildProcess('node', [startup_script, "dev"]);
    closed = false;
    var pass_along = function(data) { ! data || sys.print(data);
    };
    server.addListener('output', pass_along);
    server.addListener('error', pass_along);
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
exports.watch = watch;