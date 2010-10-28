var c = require('../cookie');


module.exports = {
    setCookie: function(name, value, options) {
        var cookie = c.stringify(name, value, options);
        if (!Array.isArray(this._cookies)) {
            this._cookies = [];
        }
        this._cookies.push(cookie);
    },

    getCookie: function(name) {
        if (!this.headers.cookie) return null;
        if (!this.cookies) { // request cookie will be parsed only one time
            this.cookies = c.parse(this.headers.cookie);
        }
        return this.cookies[name];
    },

    clearCookie: function(name, options) {
        options = options || {};
        options.expires = new Date( + new Date - 30 * 24 * 60 * 60 * 1000);
        this.setCookie(name, "", options);
    }
}