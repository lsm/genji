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

function BaseView(engine, options) {
  this.engine = engine;
  this.options = options;
}

BaseView.prototype = {

  /**
   * Render template with given context
   * 
   * @param {String} templateString Template text string
   * @param {Object} context Template context object
   */
  render: function(templateString, context) {
    return this.engine.render(templateString, context, this.partials);
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
    fs.readFile(path_, 'utf8', function(err, templateString) {
      if (err) {
        console.error(err.stack || err);
      }
      callback(err, self.render(templateString, context));
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
    if (templateString === undefined) {
      var path_ = name;
      if (this.options.rootViewPath) {
        path_ = Path.join(this.options.rootViewPath, path_);
      }
      var self = this;
      fs.readFile(path_, 'utf8', function(err, templateString) {
        if (err) {
          console.error('Failed to register partial file:');
          console.error(err.stack || err);
          return;
        }
        self.partials[name] = templateString;
      });
    } else {
      this.partials[name] = templateString;
    }
  }
};

BaseView = Base(BaseView);

var ViewWithCompilerPrototype = {
  render: function(templateString, context) {
    var compiled = this.engine.compile(templateString);
    return compiled.render(context, this.partials);
  }
};

var ViewWithCompiler = BaseView.include(ViewWithCompilerPrototype);

exports.View = View;
exports.BaseView = BaseView;
exports.ViewWithCompiler = ViewWithCompiler;