## GenJi
The word `Gen Ji` in Chinese means `root` `base` and
it's also the name of the [Japanese era name](http://en.wikipedia.org/wiki/Genji#Era) which was created to mark the beginning of a new 60-year cycle of the Chinese zodiac.
So, basically it means something **fundamental** or **beginning** of something.
The philosophy of this project follows this meaning.
It would be a collection of patterns/solutions/utils useful for daily nodejs development.
It will not force you how to use it, you could use the whole system provided or some part of it.
It will not modify the native nodejs api or put any object in the global context. It's all up to you.

## Features
- **patterns**:
    - Javascript object-oriented helper
    - Async execution control helper:
        - Executing function in serial
        - Executing functions in parallel 
    - Super lite promise support
    - Class instantializing helper (factory, singleton) and in memory registration
- **web.middleware** system which easy to control in many ways with less overhead. Current middlewares:
    - Secure-cookie 
    - Conditional get
    - Response time in header
    - Logger with different level support
    - Error handler
    - Regular expression based url router, supports sub-url and hook
- **web.handlers**:
    - simple handler for working with `request` and `response` objects of nodejs
    - cookie helper
    - handler which can serve static files
    - json-rpc
- **web (others)**:
    - HMAC-SHA1 based signer/verifier for cookie like data
    - salted sha1 password generator/verifier
    - mime helper borrowed from somewhere (tell me if you know:)
    - http client helper 
- **utils**:
    - File/dir watcher and server restart manager
    - crypto and base64 shortcuts

## Terminology
Here describes how we categorize different functionalities and why.

### Pattern
General solutions for generic problems.
Module in this subdirectory **MUST NOT** have dependencies other than nodejs or other modules under this directory.

### Middleware
Tasks or functionalities which are independent of any application.

### Handler
Some http request and response helpers which connect the high level application to low level interface.
It has application level abstraction, but it would be specific for the resources you are dealing with (e.g. static file, json-rpc).

### Utils
Utilities for web application.

## Quick start guide



## How To Contribute
Feel free to open issue or send pull request

## License

(The MIT License)

Copyright (c) 2010 Senmiao Liu <zir.echo@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.