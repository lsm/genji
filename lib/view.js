/**
 * View template manager
 */

/**
 * Module dependencies
 */

var Path = require('path');
var fs = require('fs');
var Base = require('./klass').Base;
var extend = require('./util').extend;
var parallel = require('./control').parallel;

/**
 * View constructor function.
 *
 * @param engine {Object} Template engine instance object (e.g. hogan.js)
 * @param [options] {Object} View options:
 *  {
 *    rootViewPath: '/path/to/your/view/templates', // The default absolute directory path of your template files
 *    cache: true, // cache or not
 *    context: {x: 1}, // the default context of the view instance,
 *    exts: ['.mu', '.js'] // template file extentions,
 *    layout: {'name': ['partial.mu']} // initial layout
 *  }
 * @constructor
 * @public
 */

function View(engine, options) {
  if ('function' !== typeof engine.render && 'function' !== typeof engine.compile) {
    throw new Error('Your template engine must implements at least one of "render" or "compile" functions.');
  }

  this.engine = engine;
  options = options || {};
  this.exts = options.exts || ['.mu', '.js'];
  this.contexts = {};
  this.viewPaths = {};
  this.rootViewPaths = {};
  this.partials = {};
  this.partialsEncoded = {};

  if (options.rootViewPath) {
    this.rootViewPath = options.rootViewPath;
    this.registerPartialDir();
  }

  this.hasCompiler = 'function' === typeof this.engine.compile;

  if (options.cache) {
    this.cache = {};
    if (this.hasCompiler) {
      this.cacheCompiled = {};
    }
  }
  if (options.context) {
    this.context = options.context;
  }
  if (options.layout) {
    this.setLayout(options.layout);
  }
  if (options.minify) {
    this.minify = options.minify;
  }
}

/**
 * View prototype object
 */

View.prototype = {

  /**
   * Set default rendering context for template file or layout
   *
   * @param path {String} Path/name of the template/layout
   * @param context {Object} Context object
   * @returns {*}
   * @public
   */

  setContext: function (path, context) {
    this.contexts[path] = context;
    return this;
  },

  /**
   * Render template with given context and partials
   *
   * @param templateString {String} Template text string
   * @param [context] {Object} Template context object
   * @param [partials] {Object} Optional template partial object
   * @returns {String}
   * @public
   */

  render: function (templateString, context, partials) {
    if (this.hasCompiler) {
      var compiled;
      if (this.cacheCompiled) {
        compiled = this.cacheCompiled[templateString];
      }
      if (!compiled) {
        compiled = this.engine.compile(templateString);
        if (this.cacheCompiled) {
          this.cacheCompiled[templateString] = compiled;
        }
      }
      return compiled.render(extend({}, this.context, context), partials);
    } else {
      return this.engine.render(templateString, extend({}, this.context, context), partials);
    }
  },

  /**
   * Read the template from file and render it
   *
   * @param path {String} Path to the template file
   * @param [context] {Object} Template context object
   * @param callback {Function} Callback function which accepts following arguments:
   *    {Object} err Error object,
   *    {String} rendered Rendered text
   * @public
   */

  renderFile: function (path, context, callback) {
    if ('function' === typeof context) {
      callback = context;
      context = null;
    }

    var self = this;
    var partials = this.getPartials();
    var path_ = this.getViewPath(path);

    if (this.contexts[path]) {
      context = extend({}, this.contexts[path], context);
    }

    if (this.cache && this.cache[path_]) {
      callback(null, this.render(this.cache[path_], context, partials));
      return;
    }

    fs.readFile(path_, 'utf8', function (err, templateString) {
      if (err) {
        callback(err, '');
      } else {
        if (self.cache) {
          self.cache[path_] = templateString;
        }
        callback(null, self.render(templateString, context, partials));
      }
    });
  },

  /**
   * Set a layout view.
   *
   * @param name {String|Object} Name of the layout of name/layout pair hash object
   * @param [layout] {Array} Array of partials' name for the layout
   * @returns {Object}
   * @public
   */

  setLayout: function (name, layout) {
    this.layout = this.layout || {};
    function layoutToStr(arr) {
      var str = '';
      arr.forEach(function (l) {
        str += '{{> ' + l + '}}\n';
      });
      return str;
    }

    if (typeof name === 'string') {
      this.layout[name] = layoutToStr(layout);
    } else {
      Object.keys(name).forEach(function (n) {
        this.layout[n] = layoutToStr(name[n]);
      }, this);
    }
    return this;
  },

  /**
   * Render a layout with optional context.
   *
   * @param layoutName {String} Name of the layout
   * @param [context] {Object} Optional context
   * @returns {String} Rendered result
   * @public
   */

  renderLayout: function (layoutName, context) {
    var layoutStr = this.layout[layoutName];
    if (!layoutStr) {
      throw new Error('Layout not exists');
    }
    if (this.contexts) {
      context = extend({}, this.contexts[layoutName], context);
    }
    return this.render(layoutStr, context, this.getPartials());
  },

  /**
   * Register a template partial
   *
   * @param name {String} Name of your partial or path to the partial file if `templateString` is not provided
   * @param [templateString] {String} Template text
   * @param [namespace] {String} Optional namespace of the partial
   * @public
   */

  registerPartial: function (name, templateString, namespace) {
    var name_ = name;

    if (namespace) {
      name_ = namespace + ':' + name;
    }

    var self = this;
    var minify;
    // try to get minify function for current partial type when caching is enabled
    if (this.cache && this.minify) {
      var ext = Path.extname(name);
      if (this.minify.hasOwnProperty(ext)) {
        minify = this.minify[ext];
      }
    }

    if (!templateString) {
      var path_ = this.getViewPath(name_);
      templateString = fs.readFileSync(path_, 'utf8');
    }

    if (minify) {
      templateString = minify(templateString);
    }
    templateString = self.wrapPartial(name, templateString);
    self.partials[name_] = templateString;
    self.partialsEncoded[name_] = encodeURIComponent(templateString);
    self.partialsString = JSON.stringify(self.partialsEncoded);
  },

  /**
   * Get partial object. Reload partials if caching is not enabled.
   *
   * @returns {Object}
   * @public
   */

  getPartials: function () {
    if (!this.cache) {
      this.registerPartialDir();
      Object.keys(this.rootViewPaths).forEach(function (namespace) {
        this.registerPartialDir('', namespace);
      }, this);
    }
    return this.partials;
  },

  /**
   * Set namespaced view path, register partials under the path with namespace.
   *
   * @param pathNamespace {String} Namespace of the path
   * @param viewPath {String} Directory path
   * @returns {Object}
   * @public
   */

  setViewPath: function (pathNamespace, viewPath) {
    this.rootViewPaths[pathNamespace] = viewPath;
    this.registerPartialDir('', pathNamespace);
    return this;
  },

  /**
   * Get absolute path of the view.
   *
   * @param path {String} Relative path
   * @returns {String}
   * @public
   */

  getViewPath: function (path) {
    if ((Path.sep || '/') === path[0]) {
      return path;
    }
    var path_ = this.viewPaths[path];
    if (!path_) {
      path_ = path.split(':');
      if (1 === path_.length) {
        path_ = Path.join(this.rootViewPath, path);
      } else {
        path_ = Path.join(this.rootViewPaths[path_[0]], path_[1]);
      }
    }
    return path_;
  },

  /**
   * Set the url of script loader. Now only support head.js.
   * @param url {String} Url to loader script
   * @returns {Object}
   * @public
   */

  setScriptLoaderUrl: function (url) {
    this.scriptLoaderUrl = url;
    return this;
  },

  /**
   * Registry script partial with given script names
   *
   * @param partialName {String} Name of the script partial
   * @param scripts {Array} Names of script add to this partial
   * @param onLoad {Function} Script on load function
   * @returns {Object}
   * @public
   */

  registerScriptPartial: function (partialName, scripts, onLoad) {
    var scriptStr = ['<script src="', this.scriptLoaderUrl, '" type="text/javascript"></script>\n'].join('');
    scriptStr += '<script type="text/javascript">\n';
    var self = this;
    scriptStr += 'head.js(';
    var lastIdx = scripts.length - 1;
    scripts.forEach(function (scriptName, idx) {
      var url = self.scripts[scriptName];
      scriptStr += "'" + url + "'";
      if (idx < lastIdx) {
        scriptStr += ', ';
      }
    });

    if (typeof onLoad === 'function') {
      scriptStr += ', ' + onLoad.toString();
    }
    scriptStr += ');\n</script>';
    var pName = partialName.split(':');
    if (pName.length === 2) {
      // partial has namespace
      this.registerPartial(pName[1], scriptStr, pName[0]);
    } else {
      this.registerPartial(partialName, scriptStr);
    }
    return this;
  },

  /**
   * Store script name/url pair to view.
   *
   * @param urls {Object|String} Name and url hash or name of the url
   * @param [url] {String} Optional url string if "urls" is string
   * @returns {Object}
   * @public
   */

  setScriptUrl: function (urls, url) {
    var self = this;

    function _set(name, url) {
      self.scripts = self.scripts || {};
      self.scripts[name] = url;
    }

    if (typeof urls === 'string') {
      _set(urls, url);
    } else {
      Object.keys(urls).forEach(function (name) {
        _set(name, urls[name]);
      });
    }
    return this;
  },

  /**
   * Recursively register all template partial files under the directory.
   *
   * @param [relativeDir] {String} Relative path of the directory
   * @param [namespace] {String} Namespace of the path
   * @private
   */

  registerPartialDir: function (relativeDir, namespace) {
    relativeDir = relativeDir || '';
    var self = this;
    var rootViewPath = (namespace ? this.rootViewPaths[namespace] : this.rootViewPath) || this.rootViewPath;
    var exts = this.exts;
    var dir = Path.join(rootViewPath, relativeDir);
    var files = fs.readdirSync(dir);

    files.forEach(function (file) {
      var absolutePath = Path.join(rootViewPath, relativeDir, file);
      var relativeFilePath = Path.join(relativeDir, file);
      var stats = fs.statSync(absolutePath);
      if (stats.isFile() && exts.indexOf(Path.extname(absolutePath)) > -1) {
        var viewName = (namespace ? namespace + ':' : '') + relativeFilePath;
        self.viewPaths[viewName] = absolutePath;
        self.registerPartial(relativeFilePath, null, namespace);
      } else if (stats.isDirectory()) {
        self.registerPartialDir(relativeFilePath, namespace);
      }
    });
  },

  /**
   * Wrap partial with script tag if it's a javascript partial
   *
   * @param filename {String} Name of the partial
   * @param str {String} Content of the partial
   * @returns {String}
   * @private
   */

  wrapPartial: function (filename, str) {
    var type = Path.extname(filename);
    if ('.js' === type) {
      str = '<script type="text/javascript">' + str + '</script>';
    }
    return str;
  }
};

/**
 * Expose View.
 * @type {Function}
 */

exports.View = View;
