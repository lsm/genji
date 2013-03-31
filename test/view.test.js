var genji = require('../index');
var assert = require('assert');
var View = genji.View;
var Path = require('path');
var fs = require('fs');
var hogan = require('hogan.js');

describe('View', function () {

  describe('.render', function () {
    it('should render template string using context and return result', function () {
      var view = new View(hogan);
      var tplStr = '{{name}}';
      var context = {name: 'John'};
      var result = view.render(tplStr, context);
      assert.equal('John', result);
    });

    it('should render template string using context, partials and return result', function () {
      var view = new View(hogan);
      var tplStr = '{{name}} {{> partial.mu}}';
      var context = {name: 'John'};
      var partials = {'partial.mu': 'Smith'};
      var result = view.render(tplStr, context, partials);
      assert.equal('John Smith', result);
    });
  });

  describe('renderFile', function () {
    it('should render relative file with default context', function (done) {
      var view = new View(hogan, {rootViewPath: Path.join(__dirname, '/view')});
      view.registerPartial('partial.mu', 'Smith', 'test');
      view.setContext('tmp.mu', {name: 'John'});

      var tplFile = Path.join(__dirname, '/view', 'tmp.mu');
      fs.writeFileSync(tplFile, '{{name}} {{> test:partial.mu}}');

      view.renderFile('tmp.mu', function (err, html) {
        if (err) {
          throw err;
        }
        assert.equal('John Smith', html);
        fs.unlinkSync(tplFile);
        done();
      });
    });

    it('should render absolute file path with given context', function (done) {
      var view = new View(hogan, {rootViewPath: Path.join(__dirname, '/view')});
      view.registerPartial('partial.mu', 'Smith');
      var tplFile = Path.join(__dirname, '/view', 'tmp.mu');
      fs.writeFileSync(tplFile, '{{name}} {{> partial.mu}}');
      view.renderFile(tplFile, {name: 'John'}, function (err, html) {
        if (err) {
          throw err;
        }
        assert.equal('John Smith', html);
        fs.unlinkSync(tplFile);
        done();
      });
    });

    it('should render cached content', function (done) {
      var view = new View(hogan, {
        cache: true,
        rootViewPath: Path.join(__dirname, '/view')
      });
      view.registerPartial('partial.mu', 'Smith');

      var tplFile = Path.join(__dirname, '/view', 'tmp.mu');
      fs.writeFileSync(tplFile, '{{name}} {{> partial.mu}}');

      view.renderFile('tmp.mu', {name: 'John'}, function (err, html) {
        if (err) {
          throw err;
        }

        assert.equal('John Smith', html);
        fs.unlinkSync(tplFile);

        view.renderFile(tplFile, {name: 'John'}, function (err, html) {
          if (err) {
            throw err;
          }
          assert.equal('John Smith', html);
          done();
        });
      });
    });

    it('should render namespaced template and partials', function (done) {
      var view = new View(hogan, {
        rootViewPath: Path.join(__dirname, '/view')
      });
      view.setViewPath('app', Path.join(__dirname, './view/app'));
      view.registerPartial('partial.mu', 'Smith', 'app');

      view.renderFile('app:index.html', {name: 'John'}, function (err, html) {
        if (err) {
          throw err;
        }
        assert.equal('<html><head></head><body>Welcome, John Smith! Welcome, John Smith!', html);
        done();
      });
    });
  });

  describe('layout', function () {
    it('should render with real file partial', function () {
      var view = new View(hogan, {
        rootViewPath: Path.join(__dirname, '/view'),
        context: {name: 'John'},
        layout: {'virtual:index.html': ['head.mu', 'app/welcome.mu', 'app:partial.mu']}
      });
      view.registerPartial('partial.mu', 'Smith', 'app');
      var result = view.renderLayout('virtual:index.html', {name: 'Steve'});
      assert.equal('<html><head></head><body>Welcome, Steve Smith!Smith', result);
    });

    it('should have identical result of file with same template content', function (done) {
      // setup view options for default view context and js minify function
      var viewOptions = {cache: true, context: {staticUrl: 'http://example.com'}};
      viewOptions.minify = {
        '.js': function (codeStr) {
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
      view.registerScriptPartial('script.mu', ['jquery']);
      view.registerScriptPartial('account:script.mu', ['ender', 'hogan'], function () {
        ender.noConflict();
      });

      // register a javascript view partial
      view.registerPartial('app.js', 'function App(car, dog, tree) { return [car, dog, tree].join(" ")};');
      // register a normal view partial `footer.mu` in the namespace `account`
      view.registerPartial('footer.mu', '{{copyright}}', 'account');

      // create a temporary template file
      var tplFile = Path.join(__dirname, 'view/tmp.mu');
      fs.writeFileSync(tplFile, '{{> script.mu}}\n{{> account:script.mu}}\n{{> app.js}}\n{{> account:footer.mu}}');

      // build a view layout with the same content of above template file
      view.setLayout('account:index.html', ['script.mu', 'account:script.mu', 'app.js', 'account:footer.mu']);
      var layoutHtml = view.renderLayout('account:index.html', {copyright: 'www.example.com'});

      // render the template file and compare with result of rendered layout
      view.renderFile(tplFile, {copyright: 'www.example.com'}, function (err, fileHtml) {
        assert.equal(fileHtml, layoutHtml);
        // car should be replaced by truck in the minify function
        assert.equal(true, /truck/g.test(layoutHtml));
        assert.equal(false, /car/g.test(layoutHtml));
        // cleanup
        fs.unlinkSync(tplFile);
        done();
      });
    });
  });
});