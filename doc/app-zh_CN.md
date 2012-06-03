# App 使用文档 #

`App`可以定义独立应用程序模块. 通过`App`定义的应用程序(以下简称`应用`)既支持http外部访问, 也可以在node内部调用, 这一切都是以事件为基础的.
实际上`App`将整个业务逻辑分成了三个阶段:

  - 请求匹配与输入数据标准化(可选)
  - 业务逻辑调用
  - 业务逻辑结果处理

## 定义继承与实例化 ##

### 定义一个应用 ###

首先你需要加载`genji`

  ```javascript
  var genji = require('genji');
  ```

`genji.App`是一个静态函数, 它有三个参数:

  ```javascript
  // `genji.App`参数
  var appName = 'MyPostApp'; // 定义的 应用 名称
  var appInstanceProperties = { publish: function(content){console.log(content);}, type: 'post' }; // 所定义 应用 的实例成员
  var appStaticProperties = { POST_STATUS_DRAFT: 0 }; // 所定义 应用 的类成员

  // 定义一个新的应用 `MyPostApp`
  var MyPostApp = genji.App(appName, appInstanceProperties, appStaticProperties);
  ```

### 实例化一个应用 ###

  ```javascript
  var myPostApp = new MyPostApp();
  // 运行下面的语句将会打印'my post content'
  myPostApp.publish('my post content');
  ```

### 继承一个应用 ###

只需按`genji.App`的方式调用已经定义的应用的构造函数就可以继承这个应用.

  ```javascript
  var MyBlogApp = MyPostApp('MyBlogApp', {
      // 自定义构造函数
      init: function(options) {

      },
      // 实例函数, 你可以直接调用此函数, 路由匹配后也会自动调用. 此定义将覆盖父类的定义('MyPostApp#publish')
      publish: function(matched1, json, rawData) {
        var err = null;
        this.emit('publish', err, {blogType: matched1, jsonObj: json});
      },
      // url匹配定义
      routes: {
        publish: {method: 'post', url: '^/myblogapp/publish/([a-zA-Z]*)', type: 'json'},
        update: {method: 'post', url: '/update/([a-zA-Z]*)', type: 'params'}
      },
      // 路由结果事件侦听函数
      routeResults: {
        publish: function(err, jsonObj) {},
        update: [func1, func2]
      }
    }, {BLOG_STATUS_PUBLISHED: 1});

  var myBlogApp = new MyBlogApp({urlRoot: '^/blog'});
  ```

## 实例成员说明 ##
应用的主要功能都靠定义实例成员实现, 实例成员分`保留成员`和`普通成员`. 应用在定义或者实例化时会对保留成员做一些预处理.

### 保留实例成员 ###

  - `init`: 起到自定义构造函数的功能, `init`函数是实例化应用时最后运行的函数. 它的第一个参数是一个hash对象`options`, 其他参数任意.
  目前`options`包含一个可选的预定义成员: `urlRoot` - 本应用用于匹配访问链接的url前缀, 默认值为`'^/' + 小写应用名称`.

    ```javascript
    init: function(options) {

    },
    ```

  - `routes`: 外部访问路由定义(url匹配).
    - 路由名称`publish`, 匹配成功后会运行相应的实例函数,
    - `method` http method 默认值 `get`,
    - `url` 用于匹配访问链接的正则表达式或字符串
    - `type` 需要反序列化的http输入数据类型(只针对`post`, `delete`及`put`请求):
        - `json`: 输入数据为json字符串
        - `params`: querystring
        - `data`: raw buffer

    ```javascript
    routes: {
      publish: {method: 'post', url: '^/myblogapp/publish/([a-zA-Z]*)', type: 'json'},
      // url如果不以'^'开头将自动添加前缀'urlRoot', 下面的url实际为: '^/blog/update/([a-zA-Z]*)'
      update: {method: 'post', url: '/update/([a-zA-Z]*)', type: 'params'}
    };
    ```

  - `routeResults`: 外部访问的结果事件侦听函数集. 同样是一个hash对象. 对象的key是事件名称. key对应的value是函数或者包含函数的数组.

    ```javascript
    routeResults = {
      publish: function(err, jsonObj) {

      },
      update: [func1, func2]
    };
    ```

### 普通实例成员 ###

  - `publish`: 负责具体业务逻辑的普通实例函数, 函数的签名目前取决于相应路由的定义. 参数顺序依次为: 位置参数, 名称参数(named parameters), 原始数据.
  比如:
    - `matched1` 为位置参数, 是'([a-zA-Z]*)'匹配的部分.
    - `json` 为名称参数, 是post过来的字符串反序列化后的json对象
    - `rawData` 为原始数据

    ```javascript
    publish: function(matched1, json, rawData) {
      var err = null;
      // 此事件的侦听函数为 'routeResults.publish'
      this.emit('publish', err, {blogType: matched1, jsonObj: json});
    },
    ```


## 事件 ##

事件是应用的基础, 各个环节都靠node自带的事件系统衔接.

### 事件的侦听 ###
应用的实例有两个函数可以用于注册事件侦听函数:

  - 侦听普通结果事件, 无论是外部路由访问或者内部调用均会触发此事件并执行`listener`, 为保持统一在侦听函数中一律通过`this.app`访问应用实例.

      ```javascript
      myBlogApp.onResult('publish', function listener() {
        // this.app === myBlogApp
      });
      ```

  - 路由事件, 只有外部路由访问才会触发此事件, 并且侦听函数的`this`有个特殊成员`handler`

      ```javascript
      myBlogApp.onRouteResult('publish', function listener(err, jsonObj) {
        this.handler.sendJSON(jsonObj);
      });
      ```

  `onRouteResult`和定义应用时的`routeResults`具有一样的功能.

### 事件的触发 ###
在任何实例或者侦听函数中都可以通过`this.emit`触发事件.