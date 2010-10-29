

/**
 * Copied from: [cookie-sessions](http://github.com/caolan/cookie-sessions/blob/master/lib/cookie-sessions.js)
 *
 */
exports.parse = function(cookie, name) {
   var cookies = {};
   if (typeof cookie == 'string') {
        cookies = cookie.split(/\s*;\s*/g).map(function(x){
            return x.split('=');
        }).reduce(function(a, x){
            a[unescape(x[0])] = unescape(x[1]);
            return a;
        }, {});
   }
   return name ? cookies[name] : cookies;
};

exports.stringify = function(name, value, options) {
    var cookie = name + "=" + escape(value);
    if (options) {
        options.expires && (cookie += "; expires=" + options.expires.toUTCString());
        options.path && (cookie += "; path=" + options.path);
        options.domain && (cookie += "; domain=" + options.domain);
        options.secure && (cookie += "; secure" + options.secure);
        options.httponly && (cookie += "; httponly=" + options.httponly);
    }
    return cookie;
};