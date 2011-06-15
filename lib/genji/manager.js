/**
 * File/dir watcher and restart manager for development (inspired by http://github.com/defrex/node.devserver.js).
 */
var fs = require('fs'),
    path = require('path'),
    sys = require('sys'),
    spawn = require('child_process').spawn,
    server,
    startupScript,
    lastCrashedTime,
    closed = false;

// simple command support
var stdin = process.openStdin();

stdin.setEncoding('utf8');

stdin.on('data', function (chunk) {
  if (chunk == '\n' && closed && startupScript) {
    runScript();
  }
});

stdin.on('end', function () {
  process.stdout.write('end');
});

function log(data) {
  data && sys.puts(data);
}

function runScript(script, toWatch) {
  if (typeof toWatch == 'string') toWatch = [toWatch];
  if (script && toWatch) {
    toWatch.forEach(function(path) {
      watchDir(path);
    });
  }
  startupScript = startupScript || script;
  log('Run child process: node ' + (Array.isArray(startupScript) ? startupScript.join(' ') : startupScript));
  server = spawn('node', Array.isArray(startupScript) ? startupScript : [startupScript]);
  closed = false;
  server.stdout.addListener('data', log);
  server.stderr.addListener('data', log);
  server.addListener('exit',
      function(code) {
        var restart = true;
        log('child process exits: ' + code);
        var current = new Date;
        if (lastCrashedTime && ((new Date) - lastCrashedTime) < 1000) {
          // too soon since last crash
          restart = false;
          log('Your script seems keep crashing, please have a check.');
          log('Run the script again by pushing enter.');
        }
        lastCrashedTime = current;
        closed = true;
        if (restart) {
          runScript();
        }
      });
  log('server started');
  return server;
}

function restartServer() {
  if (!closed) {
    log('restarting server...');
    // child process, called by watch->parse_file_list directly
    server ? server.kill('SIGHUP') : process.exit(0);
  }
}

function parseFileList(dir, files) {
  for (var i = 0; i < files.length; i++) {
    (function() {
      var file = path.join(dir, files[i]);
      fs.stat(file, function(err, stats) {
        if (err) throw err;
        if (stats.isDirectory()) {
          fs.readdir(file, function(err, files) {
            if (err) throw err;
            parseFileList(file, files);
          });
        } else if (stats.isFile() && path.basename(file)[0] != '.') {
          fs.watchFile(file, function(curr, prev) {
            if (curr.mtime.toString() !== prev.mtime.toString()) {
              log('File: ' + file + ' changed at: ' + curr.mtime.toLocaleTimeString());
              restartServer();
            }
          });
        }
      });
    })();
  }
}


function watchDir(path) {
  log('Start watching directory: ' + path);
  fs.readdir(path, function(err, files) {
    if (err) throw err;
    parseFileList(path, files);
  });
}

exports.runScript = runScript;
exports.watchDir = watchDir;