var genji = require('../index');
var assert = require('assert');
var View = genji.View;
var Path = require('path');
var fs = require('fs');

exports['test view'] = function () {
  var view = new View({render: function(){}, context: {staticUrl: 'http://example.com'}});

  view.setScriptLoaderUrl('{{staticUrl}}/js/head.load-0.96.min.js');
  view.setScriptUrl('jquery', '{{staticUrl}}/js/jquery-1.7.1.min.js');
  view.setScriptUrl('ender', '{{staticUrl}}/js/ender.min.js');
  view.setScriptUrl({hogan: '{{staticUrl}}/js/hogan-1.0.5.min.js'});

  view.registerScriptPartial('account:script.mujs', ['jquery', 'ender', 'hogan'], function () {
    ender.noConflict();
  });

  view.registerPartial('footer.mu', '{{copyright}}', 'account');

  var tplFile = Path.join(__dirname, 'tmp.mujs');
  fs.writeFileSync(tplFile, view.partials['account:script.mujs']);

  view.setLayout('account:index.html', ['account:script.mujs', 'footer.mu']);
  var html = view.renderLayout('account:index.html', {copyright: 'www.example.com'});

  view.renderFile(tplFile, {copyright: 'www.example.com'}, function (err, htmlOfFile) {
    assert.eql(htmlOfFile, html);
  });
}

