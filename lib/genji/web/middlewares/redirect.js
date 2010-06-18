var name = 'Redirect';
module.exports = {
    name: name,
    makeFlake: function(conf) {
        return function(req, res, go) {
            this.addListener(name, function(url, permanent) {
                res.writeHead(permanent ? 301 : 302, {"Location": url});
                res.end();
            });
            go();
        }
    }
}
