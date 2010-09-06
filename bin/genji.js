#!/usr/bin/env node

/**
 * Genji development helping script
 * 
 */

var argv = process.argv,
node = argv[0],
genji = argv[1],
script = argv[2],
sys = require('sys');

var manager = require('../lib/genji/util/manager')

if (script) {
    manager.runScript(script, [process.cwd()]);
} else {
    sys.puts('Please select a script to run');
}