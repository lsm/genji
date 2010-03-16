// @see http://wiki.apache.org/couchdb/API_Cheatsheet
//var d = require('../utils').debug;
// @todo  _baseURL and mixin

var Event = require("../core/event").Event;
var HttpSimple = require("../web/client").HttpSimple;
var qs = require("querystring");


function encodeDocId(docID) {
	/*var parts = docID.split("/");
	if (parts[0] == "_design") {
		parts.shift();
		return "_design/" + encodeURIComponent(parts.join('/'));
	}*/
	return encodeURIComponent(docID);
}

function encodeOptions(options) {
	var buf = [];
	if (typeof(options) === "object" && options !== null) {
		for (var name in options) {
			var value = options[name];
			if (name == "key" || name == "startkey" || name == "endkey") {
				value = value !== null ? JSON.stringify(value) : null;
			}
			buf.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
		}
	}
	return buf.length ? "?" + buf.join("&") : "";
}

var Couch = Event({
	init: function(dbname, host, port, encoding) {
		this._super();
		this._encoding = encoding || "utf8";
		this._client = new HttpSimple(host || "127.0.0.1", port || 5984, this._encoding);
		this._dbURL = dbname ? '/' + encodeURIComponent(dbname) + '/' : "";
	},

	setDb: function(name) {
		this._dbURL = '/' + encodeURIComponent(name) + '/';
	},
	
	statusCallback: function(ct) {
		var self = this;
		return function(code, headers, body) {
			switch(code) {
				case ct.errCode:
					self.callOrFire(ct.onError, code, headers, body);
					break;
				case ct.successCode:
					self.callOrFire(ct.onSuccess, code, headers, body);
					break;
				default:
					if (ct.errCode === undefined && ct.onError) {
						self.callOrFire(ct.onError, code, headers, body);
						break;
					}
					self.fire("unknown_error", code, headers, body);
			}
		}
	}
});

// These modules must be used with `Couch', Couch.include(Server) e.g.
var Server = {
	_get: function(url, callback) {
		this._client.get("/" + url, callback, {
			format: JSON.parse
		});
	},

	info: function(callback) {
		this._get("", callback);
	},

	activeTasks: function(callback) {
		this._get("_active_tasks", callback);
	},

	allDbs: function(callback) {
		this._get("_all_dbs", callback);
	},
	
	config: function(callback) {
		this._get("_config", callback);
	},
	
	replicate: function(source, target, callback) {
		this._get("_replicate?" + qs.stringify({
			source: source,
			target: target
		}), callback);
	},

	stats: function(callback) {
		this._get("_stats", callback);
	},

	uuids: function(count, callback) {
		this._client.get("_uuids" + (typeof count == "number" ? "?count=" + count : ""), callback);
	}
}


var Database = {
	info: function(callback, errback) {
		this._client.get(this._dbURL, this.statusCallback({
			onError: errback || "db_info_error",
			successCode: 200,
			onSuccess: callback
		}));
	},

	create: function(callback, errback) {
		this._client.put(this._dbURL, this.statusCallback({
			errCode: 412,
			onError: errback || "db_create_error",
			successCode: 201,
			onSuccess: callback
		}), {
			format: JSON.parse
		});
	},

	remove: function(callback, errback) {
		this._client.del(this._dbURL, this.statusCallback({
			errCode: 404,
			onError: errback || "db_remove_error",
			successCode: 200,
			onSuccess: callback
		}), {
			format: JSON.parse
		});
	},
	
	// @todo implement api `_changes'

	compact: function(callback, errback) {
		this._client.post(this._dbURL + '_compact', this.statusCallback({
			onError: errback || "db_compact_error",
			successCode: 202,
			onSuccess: callback
		}), {
			format: JSON.parse
		});
	},
	
	viewCleanup: function() {

	}
}

var Document = {
	allDocs: function(query, callback, errback) {
		var q = {};
		query["start"] && (q.startkey = query["start"]);
		query["end"] && (q.endkey = query["end"]);
		query["limit"] && (q.limit = query["limit"]);
		query["desc"] && (q.descending = query["desc"]);
		query["docs"] && (q.include_docs = query["docs"]);
		var url = query["seq"] ? "_all_docs_by_seq" : "_all_docs";
		this._client.get(this._dbURL + url + encodeOptions(q), this.statusCallback({
			onError: errback || "doc_allDocs_error",
			successCode: 200,
			onSuccess: callback
		}));
	},

	bulkDocs: function() {
		
	},
	
	get: function(id, callback, errback, rev) {
		this._client.get(this._dbURL + encodeDocId(id) + rev ? encodeOptions({
			rev: rev
		}) : "", this.statusCallback({
			onError: errback || "doc_get_error",
			successCode: 200,
			onSuccess: callback
		}));
	},

	revsInfo: function(id) {
		
	},
	
	set: function(id, doc, callback, errback) {
		/*
		 * When update, header:
		 * X-Couch-Full-Commit: true (optional). Ensure that the document has synced to disk before returning success.
		 */
		this._client.put(this._dbURL + encodeDocId(id), this.statusCallback({
			errorCode: 409,
			onError: errback || "doc_set_error",
			successCode: 201,
			onSuccess: callback
		}), {
			body: JSON.stringify(doc)
		});
	},
	
	del: function(id) {
		
	},
	// attachment

	/**
	 * @file {
	 * 	docID: "doc_id",
	 * 	rev: "1234", (optional)
	 * 	content: "File content",
	 * 	type: "text/plain",
	 * 	length: 12 (optional)
	 * }
	 *
	 */
	setFile: function(file, callback, errback) {
		this._client.put(this._dbURL + encodeDocId(file.docID) + encodeOptions({
			rev: file.rev
		}), this.statusCallback({
			onError: errback || "doc_setFile_error",
			successCode: 201,
			onSuccess: callback
		}), {
			body: file.content,
			headers: {
				"Content-Type": file.type,
				"Content-Length": file.length || file.content.length
			}
		});
	},

	getFile: function(docID, name, callback, errback) {
		this._client.get(this._dbURL + encodeDocId(docID) + "/" + name, this.statusCallback({
			onError: errback || "doc_getFile_error",
			successCode: 200,
			onSuccess: callback
		}));
	},

	delFile: function(docID, name, rev, callback, errback) {
		this._client.del(this._dbURL + encodeDocId(docID) + "/" + name + encodeOptions({
			rev: rev
		}), this.statusCallback({
			onError: errback || "doc_delFile_error",
			successCode: 200,
			onSuccess: callback
		}));
	}
}

var ExampleViews = {
	all: {
		map : function() {
			return 1;
		}
	}
}

// @see http://labs.mudynamics.com/wp-content/uploads/2009/04/icouch.html
var View = {
	init: function(db, design, host, port, encoding) {
		this._super(db, host, port, encoding);
		this.setDesign(design);
	},

	_stringify: function(views) {
		Object.keys(views).forEach(function(name) {
			var map = views[name]["map"];
			if (typeof map === "function") {
				views[name]["map"] = map.toString();
			}
			var reduce = views[name]["reduce"];
			if (typeof reduce === "function") {
				views[name]["reduce"] = reduce.toString();
			}
		});
		return views;
	},
	
	setDesign: function(design) {
		this._designName = encodeDocId(design);
		this._designURL = this._dbURL + "_design/" + this._designName;
	},

	getViews: function(callback, errback) {
		this._client.get(this._designURL, this.statusCallback({
			onError: errback || "view_getViews_error",
			successCode: 200,
			onSuccess: callback
		}));
	},

	setViews: function(doc, views, callback, errback) {
		doc.views = this._stringify(views);
		//doc._id = "_design/" + this._designName;
		this._client.put(this._designURL, this.statusCallback({
			onError: errback || "view_setViews_error",
			successCode: 201,
			onSuccess: callback
		}), {
			body: JSON.stringify(doc)
		});
	},

	temp: function(view, callback, errback) {
		if (typeof view["map"] === "function") {
			view["map"] = view["map"].toString();
		}
		if (typeof view["reduce"] === "function") {
			view["reduce"] = view["reduce"].toString();
		}
		this._client.post(this._dbURL + "_temp_view", this.statusCallback({
			onError: errback,
			successCode: 202, // @todo verify
			onSuccess: callback
		}), {
			body: JSON.stringify(view)
		});
	},

	query: function(view, callback, errback, options) {
		this._client.get(
			this._designURL + "/_view/" + encodeDocId(view) + encodeOptions(options),
			this.statusCallback({
				onError: errback || "view_query_error",
				successCode: 200,
				onSuccess: callback
			}));
	},

	compact: function(callback, errback) {
		this._client.post(this._dbURL + '_compact/' + this._designName, this.statusCallback({
			onError: errback || "view_compact_error",
			successCode: 202,
			onSuccess: callback
		}), {
			format: JSON.parse
		});
	}
// @todo view compaction in 0.11
}

// Modules
exports.Server = Server;
exports.Database = Database;
exports.Document = Document;
exports.View = View;
// Classes
exports.Couch = Couch;
exports.CouchServer = Couch(Server);
exports.CouchDatabase = Couch(Database);
exports.CouchDocument = Couch(Document);
exports.CouchView = Couch(View);

/* vim:tabstop=4:expandtab:sw=4:softtabstop=4
*/