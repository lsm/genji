/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var DB = require("../lib/genji/storage/couchdb").CouchDatabase,
a = require("assert");
var d = require('../lib/genji/utils').debug;

var db = new DB("genji_test");

db.on("unknown_error", function(code, headers, body) {
});
db.create(function(code, headers, body){
	a.equal(code, 201);
});