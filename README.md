Genji [![build status](https://secure.travis-ci.org/lsm/genji.png)](http://travis-ci.org/lsm/genji)
=====

Writing reusable, modular and flexible node.js applications made easy.

## Introduction

Genji is not a full stack web framework, instead it focuses on making your code reusable and flexible enough to integrate
with other components and frameworks. In development of modern web application, your service usually consumed by various
kinds of clients with different manners. You may have web site for browser user, private apis for mobile clients, public
apis for third-party developers and internal apis for queues or job workers. Genji helps you write reusable code by
providing extensible plugin/middleware system, routing/transport agnostic application class, models fields validation
and custom getter/setter method, views layout manager and namespaced template overriding, url routing with hook support.
While it doesn't mean you have to stick with a particular development style or technology, genji is highly modular
designed and customizable, so you can decide which part of the framework to use and how.

- For documentations see: [http://lsm.github.com/genji](http://lsm.github.com/genji)
- Check out the [test coverage](http://lsm.github.com/genji/coverage.html) and [plato report](http://lsm.github.com/genji/plato) for source analysis
- Ideas, bug report or general discussion are always welcome, feel free to open issue at: [https://github.com/lsm/genji/issues](https://github.com/lsm/genji/issues)


### About the name "Genji"

The word `Gen` `Ji` in Chinese means `root` `base` and it's also the name of the
[Japanese era name][genji] which was created to mark the beginning of a new 60-year
cycle of the Chinese zodiac. So, basically it means something **fundamental** that you can **grow with**.
The philosophy of this project follows this meaning.

## License

(The MIT License)

Copyright (c) 2010-2013 Senmiao Liu <senmiao.liu@gmail.com>

[genji]: http://en.wikipedia.org/wiki/Genji_(era) "Genji (era)"