

exports.Router = Router;

function Router(options) {
  this.routes = [];
  this.notFounds = [];
  options = options || {};
  if (options.injector) {
    this.injector = options.injector;
  }
}

Router.prototype = {
  
  add: function(method, pattern, handler) {
    if (this.injector) {
      handler = this.injector.inject(handler);
    }
    var route = new Route(method, pattern, handler);
    this.routes.push(route);
    return this;
  },
  
  dispatch: function(method, path, context) {
    var matched = this.routes.some(function(r) {
      var matches = r.match(method, path);
      if (matches) {        
        if (Array.isArray(matches)) {
          r.handler.apply(context, matches);
        } else {
          context.regDependency(matches);
          r.handler.call(context);
        }
        return true;
      }
    });
    
    if (!matched) {
      matched = this.notFounds.some(function(r){
        var matches = r.match(method, path);
        if (matches) {
          if (Array.isArray(matches)) {
            r.handler.apply(context, matches);
          } else {
            context.regDependency(matches);            
            r.handler.call(context);
          }
          return true;
        }
      });
    }
    return matched;
  },
  
  /**
   * Define a route with type 'GET'
   *
   * @param url {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function to handle the request
   * @return {Object}
   * @public
   */

  get: function (pattern, handler) {
    this.add('get', pattern, handler);
    return this;
  },

  /**
   * Define a route with type 'POST'
   *
   * @param url {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function to handle the request
   * @return {Object}
   * @public
   */

  post: function (pattern, handler) {
    this.add('post', pattern, handler);
    return this;
  },

  /**
   * Define a route with type 'PUT'
   *
   * @param url {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function to handle the request
   * @return {Object}
   * @public
   */

  put: function (pattern, handler) {
    this.add('put', pattern, handler);
    return this;
  },

  /**
   * Define a route with type 'DELETE'
   *
   * @param url {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function to handle the request
   * @return {Object}
   * @public
   */

  'delete': function (pattern, handler) {
    this.add('delete', pattern, handler);
    return this;
  },

  /**
   * Define a route with type 'HEAD'
   *
   * @param url {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function to handle the request
   * @return {Object}
   * @public
   */

  head: function (pattern, handler) {
    this.add('head', pattern, handler);
    return this;
  },

  /**
   * Define a route with type 'NOTFOUND'
   *
   * @param url {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function to handle the request
   * @return {Object}
   * @public
   */

  notFound: function (pattern, handler) {
    if (this.injector) {
      handler = this.injector.inject(handler);
    }
    var route = new Route(method, pattern, handler);
    this.notFounds.push(route);
    return this;
  },
};

var reNamedParam = /[^?]:[^/#?()\.\\]+/g;
var namedParamReplacement = '([^/#?]+)';

function Route(method, pattern, handler) {
  this.method = method.toLowerCase();
  var self = this;
  
  if (!(pattern instanceof RegExp)) {
    var namedParams = [];
    pattern = pattern.replace(reNamedParam, function(matched) {
      if (matched[0] === ':') {
        namedParams.push(matched.slice(1));
      }
      return namedParamReplacement;
    });
    if (namedParams.length > 0) {
      this.namedParams = namedParams;
    }
  }
  
  this.pattern = pattern;
  this.handler = handler;
}

Route.prototype = {
  match: function(method, path) {
    if (method.toLowerCase() !== this.method && 'any' !== this.method) {
      return false;
    }
    
    var matched = path.match(this.pattern);
    if (null === matched) {
      return false;
    }

    var matches = [];
    for (var i = 1; i < matched.length; i++) {
      matches.push(matched[i]);
    }

    if (this.namedParams) {
      var namedParams = this.namedParams;
      var m = {};
      matches.forEach(function(match, idx) {
        m[namedParams[idx]] = match;
      });
      matches = m;
    }

    return matches;
  }
};
