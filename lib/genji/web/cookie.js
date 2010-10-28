
exports.parse = function(cookie, name) {
    var cookies = {};
    typeof cookie == 'string' && cookie.replace(/^ *| *$/g, '')
    .split(/ *; */)
    .map(function(cookie) {
        var parsed = cookie.split(/ *= */);
        cookies[parsed[0]] = parsed[1];
    });
    return name ? cookies[name] : cookies;
};

exports.stringify = function(name, value, options) {
    var cookie = name + "=" + value;
    if (options) {
        options.expires && (cookie += "; expires=" + options.expires.toUTCString());
        options.path && (cookie += "; path=" + options.path);
        options.domain && (cookie += "; domain=" + options.domain);
        options.secure && (cookie += "; secure" + options.secure);
        options.httponly && (cookie += "; httponly=" + options.httponly);
    }
    return cookie;
};