0.1.0 (?)
---------
- Remove a lots of functionalities, keep small and focus.
- Introduce `App`

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