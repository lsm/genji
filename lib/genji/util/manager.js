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
 * File/dir watcher and restart manager for development (inspired by http://github.com/defrex/node.devserver.js).
 * @todo add crash detect, close child process when main exited.
 */
var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn,
server,
startupScript,
closed = false;

var genjiPath = __dirname.split('/');
genjiPath = genjiPath.slice(0, genjiPath.length - 1).join('/');

var runScript = function(script, watch) {
    watch && script && watchDir(genjiPath);
    var node = process.argv[0];
    startupScript = startupScript || script;
    sys.puts("Run child process: " + node + " " + startupScript);
    server = spawn(node, [startupScript]);
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
            runScript();
        });
    sys.puts('server started');
    return server;
};

var defaultSettings = exports.defaultSettings = {
    env: {type: 'development', level: 2}
    ,servers: [
        {host: '127.0.0.1', port: 8000}
    ]
    ,middlewares: [
        {name: 'error-handler'},
        {name:'logger'},
        {name: 'redirect'},
        {name: 'router', conf: {handler: 'genji.web.handler.SimpleHandler', urls: './app'}}
    ]
}

function startServer(settings) {
    // @todo implement multi-server instances
    settings = settings || defaultSettings;
    settings.env.root = settings.env.root || path.dirname(process.mainModule.filename);
    settings.env.genjiPath = genjiPath;
    setLevel(settings.env.level || 1, settings.env);
    genji.settings = settings;
    if (settings.env.type === 'development' && exports.optionParse('dev')) {
        watchDir(settings.env.root);
        return {child: runScript(process.mainModule.filename, true)};
    } else {
        // Not in development mode, start server directly
        return {server: genji.web.startServer(settings)};
    }
}

var restartServer = function() {
    sys.puts('change discovered, restarting server');
    if (!closed) {
        // child process, called by watch->parse_file_list directly
        server ? server.kill() : process.exit(0);
    }
};

var parseFileList = function(dir, files) {
    for (var i = 0; i < files.length; i++) {
        (function() {
            var file = dir + '/' + files[i];
            fs.stat(file, function(err, stats) {
                if (err) throw err;
                if (stats.isDirectory()) {
                    fs.readdir(file, function(err, files) {
                        if (err) throw err;
                        parseFileList(file, files);
                    });
                } else if (stats.isFile()) fs.watchFile(file,
                    function(curr, prev) {
                        if (curr.mtime.toString() !== prev.mtime.toString()) {
                            restartServer();
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
        parseFileList(path, files);
    });
}

exports.startServer = startServer;
exports.watch = watchDir;