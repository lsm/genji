

var Path = require('path');

function merge(a, b) {
    for (var name in b) {
        if (name in a) throw new Error('Duplicated testing name');
        a[name] = b[name];
    }
}

var exports = {};


var tests = {
    'pattern': [
    'base', 'control', 'factory', 'pool'
    ],
    'util': [
    'benchmark', 'base64'
    ],
    'web': [
        'router', 'auth'
    ]
}

function loadTests(suffix) {
    suffix = suffix || '.test';
    for (var module in tests) {
        tests[module].forEach(function(item) {
            var test = require('./' + Path.join(module, item + suffix));
            merge(exports, test)
        });
    }
}

loadTests();

module.exports = exports;