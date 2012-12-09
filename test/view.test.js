var genji = require('../index');
var assert = require('assert');
var View = genji.View;
var Path = require('path');
var fs = require('fs');
var hogan = require('hogan.js');

exports['test view'] = function () {
  // setup view options for default view context and js minify function
  var viewOptions = {cache: true, context: {staticUrl: 'http://example.com'}};
  viewOptions.minify = {
    js: function (codeStr) {
      var result = codeStr.replace(/car/g, 'truck');
      return result;
    }
  };
  // create the view instance with template engine
  var view = new View(hogan, viewOptions);

  // set script loader url (only support headjs currently)
  view.setScriptLoaderUrl('{{staticUrl}}/js/head.load-0.96.min.js');
  // set external scripts with name and url
  view.setScriptUrl('jquery', '{{staticUrl}}/js/jquery-1.7.1.min.js');
  view.setScriptUrl('ender', '{{staticUrl}}/js/ender.min.js');
  // set external scripts with name and url as hash
  view.setScriptUrl({hogan: '{{staticUrl}}/js/hogan-1.0.5.min.js'});

  // register a view script partial, which loads `jquery`, `ender` and `hogan` on browser side
  // and run the given function after loaded scripts.
  view.registerScriptPartial('account:script.mu', ['jquery', 'ender', 'hogan'], function () {
    ender.noConflict();
  });

  // register a javascript view partial
  view.registerPartial('app.js', 'function App(car, dog, tree) { return [car, dog, tree].join(" ")};');
  // register a normal view partial `footer.mu` in the namespace `account`
  view.registerPartial('footer.mu', '{{copyright}}', 'account');

  // create a temporary template file
  var tplFile = Path.join(__dirname, 'tmp.mu');
  fs.writeFileSync(tplFile, '{{> account:script.mu}}\n{{> app.js}}\n{{> account:footer.mu}}');

  // build a view layout with the same content of above template file
  view.setLayout('account:index.html', ['account:script.mu', 'app.js', 'account:footer.mu']);
  var html = view.renderLayout('account:index.html', {copyright: 'www.example.com'});

  // render the template file and compare with result of rendered layout
  view.renderFile(tplFile, {copyright: 'www.example.com'}, function (err, htmlOfFile) {
    assert.eql(htmlOfFile, html);
    // car should be replaced by truck in the minify function
    assert.eql(true, /truck/g.test(html));
    assert.eql(false, /car/g.test(html));
    // cleanup
    fs.unlinkSync(tplFile);
  });
};

