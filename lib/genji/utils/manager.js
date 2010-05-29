var sys = require('sys')
setLevel = require('./shortcuts').setLevel;

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
    setLevel(settings.level || 1, settings.debug);
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

exports.start = run_server;
exports.watch = watchDir;