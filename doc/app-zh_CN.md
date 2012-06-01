# App 使用文档 #

`App`可以定义独立应用程序模块. 通过`App`定义的应用既支持http外部访问, 也可以在node内部调用, 这一切都是以事件为基础的.
实际上`App`将整个业务逻辑分成了三个阶段:
  - 请求匹配与输入数据标准化(可选)
  - 业务逻辑调用
  - 业务逻辑结果处理

## 定义继承与实例化 ##

### 定义一个App ###

首先你需要加载`genji`

    var genji = require('genji');

`genji.App`是一个静态函数, 它有三个参数:

    // `genji.App`参数
    var appName = 'MyPostApp'; // 定义的 app 名称
    var appInstanceProperties = { publish: function(content){console.log(content);}, type: 'post' }; // 所定义 app 的实例成员
    var appStaticProperties = { POST_STATUS_DRAFT: 0 }; // 所定义 app 的类成员

    // 定义一个新的app `MyPostApp`
    var MyPostApp = genji.App(appName, appInstanceProperties, appStaticProperties);

### 实例化App ###

    var myPostApp = new MyPostApp();
    // 运行下面的语句将会打印'my post content'
    myPostApp.publish('my post content');

### 继承一个App ###

只需按`genji.App`的方式调用已经定义的应用的构造函数就可以继承这个应用.

    var MyBlogApp = MyPostApp('MyBlogApp', {type: 'blog'}, {BLOG_STATUS_PUBLISHED: 1});
    var myBlogApp = new MyBlogApp();
    // 'blog'
    myBlogApp.type;

### 实例成员说明 ###

  - `init`: 起到自定义构造函数的功能, `init`函数是实例化app时最后运行的函数. 它的第一个参数是一个hash对象`options`, 其他参数任意.
  目前`options`包含一个可选的预定义成员: `urlPrefix` - 本应用用于匹配访问链接的url前缀, 默认值为`'^/' + 小写应用名称`.


    appInstanceProperties.init = function(options) {};

  - `routes`: 外部访问路由定义(url匹配).

    - 路由名称`publish`,
    - `method` http method,
    - `url` 用于匹配访问链接的正则表达式或字符串
    - `type` 需要反序列化的http输入数据类型(只针对`post`, `delete`及`put`请求):
        - `json`: 输入数据为json字符串
        - `params`: querystring
        - `data`: raw buffer

    appInstanceProperties.routes = {
      publish: {method: 'post', url: '^/myblogapp/publish/([a-zA-Z]*)', type: 'json'}
      // url如果不以'^'开头将自动添加前缀'urlRoot', 下面的url实际为: '^/myblogapp/update/([a-zA-Z]*)'
      update: {method: 'post', url: '/update/([a-zA-Z]*)', type: 'params'}
    };

  - `routeResults`: 外部访问的结果事件侦听函数集. 同样是一个hash对象. 对象的key是事件名称. key对应的value是函数或者包含函数的数组.


    appInstanceProperties.routeResults = {
      publish: function() {

      },
      update: [func1, func2]
    };

  - 除以上保留名外, 其他均视为普通实例成员.

## 事件 ##

事件是`App`的基础.`App`的各个环节都是靠事件衔接的.