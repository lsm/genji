## GenJi
The word `Gen Ji` in Chinese means `root` `base` and
it's also the name of the [Japanese era name](http://en.wikipedia.org/wiki/Genji#Era) which was created to mark the beginning of a new 60-year cycle of the Chinese zodiac.
So, basically it means something **fundamental** or **beginning** of something.
The philosophy of this project follows this meaning.
It would be a collection of patterns/solutions/utils useful for daily nodejs development. It will not force you how to use it, you could use the whole system provided or some part of it. It will not modify the native nodejs api or put any object in the global context.

##Features
- **patterns**:
    - Javascript object-oriented helper
    - Pooling
    - Functions chaining helper (execution control)
    - Executing functions in parallel *
    - Promise/deferred *
    - Class instantializing helper (factory) and in memory registration
    - In memory caching
- **middleware** system which easy to control in many ways with less overhead:
    - Conditional get
    - Response time in header
    - Logger with different level support
    - Error handler
    - Regular expression based url router, supports sub-url and hook
- **handlers** (see below):
    - simple handler for working with `request` and `response` objects of nodejs
    - cookie helper
    - handler which can serve static files
    - handler for streaming data *
    - json-rpc *
- **utils**:
    - File/dir watcher and server restart manager
    - HMAC-SHA1 based signer/verifier for cookie like data
    - salted sha1 password generator/verifier
    - mime helper borrowed from somewhere (tell me if you know:)
    - http client helper *
    - base64 encoder/decoder borrowed from [webtoolkit.info](http://www.webtoolkit.info/)



## How To Contribute
This readme was first time written after read the great post [Readme Driven Development](http://tom.preston-werner.com/2010/08/23/readme-driven-development.html)
of [Tom Preston-Werner](http://tom.preston-werner.com/).
So, this readme is a brief description about what the project it's and what it will become in the future.
If you have an idea which will **dramatically** change the direction of the project, you could `fork` the project,
`put` the idea in this readme and `send` out a pull request.
If you have more specific suggestion or features want to implement,
then you can put them in file **CHANGELOG.md** under an existent version or create a new version if you think make sense,
and follow the same step like above (fork, change, send pull request).
Here we may follow the concept: `Changelog for future = todo list`.



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