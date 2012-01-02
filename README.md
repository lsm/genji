A simple micro-framework for nodejs.

## Features
- Simple and fast **middleware** layer and functionalities.
- Dynamic url **routing** with plugin support
- Http request/response **handler**
- **Async** operation helpers (e.g. promise, parallel)
- Javascript **class**

## Quick start guide

    var genji = require('genji');

    // create an app instance
    var helloApp = genji.app();

    // routing url to function
    helloApp.get('^/$', function(handler) {
      handler.send('Hello world!');
    });

    // create a http server
    var server = genji.createServer();

    // start handling request
    server.listen(8888, '127.0.0.1');


## Run test

    npm install expresso -g # this will install expresso in global scope
    git clone git://github.com/zir/genji.git
    cd genji
    npm test

## How To Contribute

Feel free to open issue or send pull request


## About GenJi
The word `Gen` `Ji` in Chinese means `root` `base` and
it's also the name of the [Japanese era name](http://en.wikipedia.org/wiki/Genji#Era) which was created to mark the beginning of a new 60-year cycle of the Chinese zodiac.
So, basically it means something **fundamental** or **beginning** of something.
The philosophy of this project follows this meaning.







## License

(The MIT License)

Copyright (c) 2010-2012 Senmiao Liu <zir.echo@gmail.com>

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