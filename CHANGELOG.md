0.3.0 (?)
- Add `vhost` support
- `App` error handler

0.2.2(?)
- introduce `event` in `control#defer`

0.2.1 (?)
- Add timeout support for `control#parallel`
- Refactor `router`
- bug fix for handler#Simple#sendJson

0.2.0 (2011/07/10)
---------
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


0.1.0 (2011/06/29)
---------
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

0.0.3 (2011/06/13)
---------
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