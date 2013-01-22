# Genji [![build status](https://secure.travis-ci.org/zir/genji.png)](http://travis-ci.org/zir/genji)
Writing reusable and flexible node.js application made easy. 

## Introduction

Genji is not a full stack web framework, instead it focus on making your code reusable and flexible enough to integrate with other components and frameworks.
In development of modern web application, your service usually consumed by various kinds of clients with different manners. You may have web site for browser user, private apis for mobile clients, external http public apis for third-party developers and internal apis for queues or job workers.
Genji helps you write reusable code by providing url router with hooks, routing agnostic application class, models fields validation and custom getter/setter method, views layout manager with namespaced template overriding. While it doesn't mean you have to stick with a particular development style or technology, genji is highly modular designed and customizable, so you can decide which part of the framework to use and how.

- For docs and everything else see: [http://lsm.github.com/genji/documentation](http://lsm.github.com/genji/)
- Ideas, bug report or general discussion are always welcome, feel free to open issue at: [https://github.com/lsm/genji/issues](https://github.com/lsm/genji/issues)

#### About "GenJi"

The word `Gen` `Ji` in Chinese means `root` `base` and
it's also the name of the [Japanese era name](http://en.wikipedia.org/wiki/Genji#Era) which was created to mark the beginning of a new 60-year cycle of the Chinese zodiac.
So, basically it means something **fundamental** or **beginning** of something.
The philosophy of this project follows this meaning.


## License

(The MIT License)

Copyright (c) 2010-2013 Senmiao Liu <zir.echo@gmail.com>

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