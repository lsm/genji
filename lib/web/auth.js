var cookie = require("./cookie"),
base64 = require("./crypto/base64"),
couchdb = require("./couchdb").init("shtf_manage");

function authenticate(username, password) {
    return true;
}

function logged_in(req, res) {
    // check if we have signed cookie
    if (_has_auth_cookie(req)) {
        return false;
    }
    res.redirect("/login/");
    return true;
        //res.setCookie("_mba", base64.encode(cookie.sign(["shqp", 123456789]), {path: "/"}));
        //res.setCookie("_mba", cookie.sign(["shqp", 123456789]), {path: "/"});
}

function authHandler(req, res) {
    if (req.method == "POST") {
        couchdb.get('users', function(couch_res){
                //res.sendHeader(200, {"Content-Type": "text/html"});
                res.sendBody("couchdb returned!");
                res.sendBody(JSON.stringify(couch_res));
                //res.sendBody("<script language=\"javascript\">alert(1);</script>");
                res.finish();
            });
        return false;
    }
    res.sendHeader(404, {});
    res.finish();
    return true;
}

function _has_auth_cookie(req) {
    var c = req.getCookie("_mba");
    if (c) {
        c = base64.decode(c).replace(/[\x00-\x20]/g, "")
        if (cookie.verify(c)) {
            req._yy_auth_cookie = c;
            return true;
        }
    }
    return false;
}

exports.logged_in = logged_in;
exports.authHandler = authHandler;