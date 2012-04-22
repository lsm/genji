var Path = require('path');
var fs = require('fs');
var Base = require('./base');


/**
 * Factory function to create a view instance
 * 
 * @param {Object} engine Template engine like hogan.js
 * @param {Object} options View options:
 *  {
 *    rootViewPath: '/path/to/your/view/templates' // The default absolute path of your template files
 *  }
 *
 *  @return {Object} instance of view
 */
function View(engine, options) {
  if (typeof engine.render !== 'function' && typeof engine.compile !== 'function') {
    throw new Error('Your template engine must implements at least one of these functions: `render` and `compile`.');
  }
  var view;
  if (typeof engine.compile === 'function') {
    view = new ViewWithCompiler(engine, options);
  } else {
    view = new View(engine, options);
  }
  return view;
}

function recursiveRegisterPartials(viewInstance, relativePath) {
  var rootViewPath = viewInstance.options.rootViewPath;
  var exts = viewInstance.options.exts;
  var dir = Path.join(rootViewPath, relativePath);
  fs.readdir(dir, function(err, files) {
    if (err) {
      console.trace(err.stack || err);
      throw err;
    }
    files.forEach(function(file) {
      var absolutePath = Path.join(rootViewPath, relativePath, file);
      var relativeFilePath = Path.join(relativePath, file);
      fs.stat(absolutePath, function(err, stats) {
        if (err) {
          console.trace(err.stack || err);
          throw err;
        }
        if (stats.isFile() && exts.indexOf(Path.extname(absolutePath)) > -1) {
          viewInstance.registerPartial(relativeFilePath);
        }
        if (stats.isDirectory()) {
          recursiveRegisterPartials(viewInstance, relativeFilePath);
        }
      });
    });
  });
}

function BaseView(engine, options) {
  this.engine = engine;
  this.options = options || {};
  this.options.exts = this.options.exts || ['.mu'];
  if (this.options.rootViewPath) {
    recursiveRegisterPartials(this);
  }
  if (this.options.cache) {
    this.fileCache = {};
    this.clientCodeString = exports.getClientCodeString();
  }
}

BaseView.prototype = {

  /**
   * Render template with given context
   * 
   * @param {String} templateString Template text string
   * @param {Object} context Template context object
   */
  render: function(templateString, context) {
    return this.engine.render(templateString, context, this.getPartials());
  },

  /**
   * Read the template from file and render it
   * 
   * @param {String} path Path to the template file
   * @param {Object} context Template context object
   * @param {Function} callback Callback function which accepts following arguments:
   *    {Object} err Error object,
   *    {String} rendered Rendered text
   */
  renderFile: function(path, context, callback) {
    var path_ = path;
    if (this.options.rootViewPath) {
      path_ = Path.join(this.options.rootViewPath, path_);
    }
    var self = this;
    if (this.options.cache) {
      if (this.fileCache[path_]) {
        callback(null, this.render(this.fileCache[path_], context));
        return;
      }
    }
    fs.readFile(path_, 'utf8', function(err, templateString) {
      if (err) {
        console.trace(err.stack || err);
      }
      callback(err, self.render(templateString, context));
      if (self.options.cache) {
        self.fileCache[path_] = templateString;
      }
    });
  },

  /**
   * Register a template partial
   *
   * @param {String} name Name of your partial or path to the partial file if `templateString` is not provided
   * @param {String} templateString Template text
   */
  registerPartial: function(name, templateString) {
    this.partials = this.partials || {};
    this.partialsEncoded = this.partialsEncoded || {};

    var self = this;

    function reg(tplStr) {
      self.partials[name] = tplStr;
      self.partialsEncoded[name] = encodeURIComponent(tplStr);
      self.partialsString = JSON.stringify(self.partialsEncoded);
    }

    if (templateString === undefined) {
      var path_ = name;
      if (this.options.rootViewPath) {
        path_ = Path.join(this.options.rootViewPath, path_);
      }

      fs.readFile(path_, 'utf8', function(err, fileContent) {
        if (err) {
          console.error('Failed to register partial file:');
          console.error(err.stack || err);
          return;
        }
        reg(fileContent);
      });
    } else {
      reg(templateString);
    }
  },

  getPartials: function() {
    if (!this.options.cache) {
      recursiveRegisterPartials(this);
    }
    return this.partials;
  },

  getClientCodeString:function () {
    var str = '';
    if (this.options.cache) {
      str = this.clientCodeString;
    } else {
      str = exports.getClientCodeString();
    }
    return str;
  }
};

BaseView = Base(BaseView);

var ViewWithCompilerPrototype = {
  render: function(templateString, context) {
    var compiled = this.engine.compile(templateString);
    return compiled.render(context, this.getPartials());
  }
};

var ViewWithCompiler = BaseView.include(ViewWithCompilerPrototype);

function getClientCodeString() {
  var codeStr = fs.readFileSync(Path.join(__dirname, 'model.js'), 'utf8');
  return codeStr;
}

exports.View = View;
exports.BaseView = BaseView;
exports.ViewWithCompiler = ViewWithCompiler;
exports.getClientCodeString = getClientCodeString;