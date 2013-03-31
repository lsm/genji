CHANGELOG
=========

## 0.7 (2013)

### 0.7.0 (2013/03/31)

**NOTE**: This version is **not compatible** with version **0.5.x**

- Documentation
- Introduce `Klass` - lightweight Javascript OO implementation
- Introduce `Core` - the plugin/middleware system
- Introduce `Site`
  - to avoid global shared object in `lib/genji.js`
  - setting management namespaced by environment
  - coporate with `Core` and map routes to apps
- Replace `Handler` with `Context`, convert some handlers to plugins
- Refactor `router`
  - allow routing without middleware
  - overwrite routes which has same url pattern and http method
- Rewrite `App`
  - use `Klass`
  - separate routing from App logic
  - remove support of static properties
- Rewrite `Model`
  - use `Klass`
  - remove support of static properties
- Remove `Role`
- Remove `Base`
- Remove file plugin and lib/mime.js
- Refactor `view`

## 0.5 (2012)

### 0.5.10 (2012/12/15)

- `App` clone routes object before use
- `Handler` keep parsed and raw http request data

### 0.5.9 (2012/12/15)

- `View#minify`
- `json`, `html`, `text` shortcuts for `App#routeResults`

### 0.5.8 (2012/11/24)

- `handler#sendAsFile`
  - allow customize response headers
  - detect Buffer when calculate data length

### 0.5.7 (2012/11/06)

- `util#expose` export sub modules
- remove `client.js`
- `Model` `toData` and `toDoc` accept array as argument to indicate the fields you need to get.
- `App#routePreHook` support bulk set prehook for array of routes

### 0.5.6 (2012/10/31)

- `crypto#decipher` handle exception 'TypeError: DecipherFinal fail' when decipher string with different key ciphered

### 0.5.5 (2012/10/26)

- `control`
  - `defer().defer(otherDeferrable)`
  - `defer().callback(cb)`

### 0.5.4 (2012/09/14)

 - set default context for layout
 - batch attache prehook to routes
 - allow set cookie during redirection
 - default options for `Role`

### 0.5.3 (2012/08/17)

- node 0.8.x compatibility

### 0.5.2-2 (2012/07/21)

- Bug fix for `Model`

### 0.5.2-1 (2012/07/18)

- Bug fix for `App`

### 0.5.2 (2012/07/05)

- `Model`
  - new field type and type validator: `array`, `regexp`, `date`, `bool`
  - dynamic fields validation status
  - instance function accepts callback function as last argument,
    call `this.emit()` as usual will call the callback and event won't be emitted.
  - use `toDoc()` instead of `toData('alias')`
  - bug fix for type validation
- `App`
  - bug fix for instance function not return result

### 0.5.1 (2012/06/16)

- `View`
  - add script loader support (head.js)
  - change `addViewPath` to `setViewPath`
  - add support for default context (e.g. var view = new View(engine, {context: {title: 'Title'}});)
  - merge `BaseView` with `ViewWithCompiler`
  - basic `layout` manager
- `Model`
  - `model.attr([key1, key2])` get group of attributes as hash object
  - Bi-direction aliased field name
- `App` support application level and route level `routePreHook`
- Introduce `Role`

### 0.5.0 (2012/06/05)

- external app loader
- New `App` module
- `genji.app` renamed to `genji.route`

### 0.3.3 (2012/05/19)

- expose submodules by default, `genji.short` and `genji.require` are deprecated
- rewrite `lib/model.js`, added test
- support multi-root path for view template (with namespace)
- add `Model#changed`, return object which contains changed fields/values after initialized.
- add `util#byteLength`

### 0.3.2 (2012/05/08)

- improve `view` and `model`

### 0.3.1 (2012/03/12)

- improve `view` partial
- introduce `model`

### 0.3.0 (2012/01/05)

- introduce `view` for working with template engine like [hogan.js](https://github.com/twitter/hogan.js)
  - render files
  - simple caching support
  - preregister partial files in the `rootViewPath`

### 0.2.4 (2012/01/02)

- add `send`, `sendJSON` and `sendHTML` to the `base#BaseHandler`
- introduce `event` in `control#defer`

### 0.2.3 (2011/12/15)

- Upgraded `expresso` for node 0.6.x support

### 0.2.2 (2011/08/29)

- Cleaned code follow default jshint rules
- Rewrited `client.js#Client` and added some tests

### 0.2.1 (2011/08/11)

- Add timeout support for `control#parallel`
- bug fix for handler#Simple#sendJson
- new event for handler with method `POST`/`PUT`:
  - `data` for raw data
  - `params` for http query string, parsed as plain javascript object
  - `json` for json string, parsed as plain javascript object

### 0.2.0 (2011/07/10)

- Changed the way how we define sub url for `App#[get, post, put, del, head]`
- `control#defer`
  - put flow control object as the first argument of `and` callback
  - callbacks of `and`, `then` now will be called in registered order
    `defer(fs.readFile, fs).and(fn1, fn2, fn3).then(fn4, fn5).and(fn6, fn7)`
    functions will be called in the following order:
    fn1->fn2->fn3->(fn4&fn5)->fn6->fn7
- `util#extend` takes unlimited arguments `extend(obj, props1, props2, ...,
propsN)`
- Add `crypto#hmac`
- `handler#Simple` parses url parameters by default
- Add context for `control#parallel`


### 0.1.0 (2011/06/29)

- Remove a lots of functionalities, keep small and focus.
- Introduce `App`
- `control#parallel` set done/fail callbacks by
  `parallel.done(fn)` and `parallel.fail(fn)`
- add `genji.short`:
  extends the `genji` namespace with `util` `base` `control` submodules
- Simplified `handler`,
  - the default handler is `genji.require('handler').Handler`
  which can handle normal http request, parse cookies and send files
  - you can use `genji.require('handler').BaseHandler`
  to include features you only need

### 0.0.3 (2011/06/13)

- etag for sending file-like contents
- util
    - crypto
        - new shorthand functions for cipher/decipher
        - enable to select the digest encoding for `md5`, `sha1`, `hmac_sha1`
- web
    - middleware
        - now the middleware does not care about application settings
        - new style middleware config format
        - `secure-cookie` new middleware to encrypt/decrypt cookie
    - router, new url routing system, supports declarative and programmatic style of defining url rules.
    - move `createServer`/`startServer` into submodule `web.server`, `web/index.js` only use to export submodules
- pattern
    - control
        - promise: call the original async function in next tick
    - math, new pattern group, add `random`