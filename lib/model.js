!(function () {

  var models = {};

  function Model(name, properties, staticConsts) {

    if (models[name] && !properties) {
      // load Model from cache
      return models[name];
    }

    /**
     * Private model field info
     */
    var _fields;

    /**
     * Private model alias info
     */
    var _aliases;
    var _maps;

    /**
     * Model name
     */
    var _name = name;

    /**
     * The unique id of the document record, default is `_id`
     */
    var _idAttribute = '_id';

    function ModelConstructor(data) {
      /**
       * Private data holder
       */
      var _data = {};

      function model(data) {
        Object.keys(data).forEach(function (key) {
          this.attr(key, data[key]);
        }, this);
        if (typeof this.init === 'function') {
          this.init(_data);
        }
      }

      var prototype = {

        attr:function (key, value) {
          if (typeof value === 'undefined') {
            return _data[key];
          } else {
            // apply property's validator/formatter if any, when original data doc has no `_idAttribute`
            var fn = this[key];
            if (!data[_idAttribute] && typeof fn === 'function') {
              _data[key] = fn.call(this, value);
            } else {
              _data[key] = value;
            }
          }
        },

        toData:function () {
          var data = {};
          Object.keys(_data).forEach(function (key) {
            if (_data[key]) {
              data[_maps[key] || key] = _data[key];
            }
          });
          return data;
        },

        toAliasedData:function () {
          if (_aliases) {
            var data = {};
            Object.keys(_data).forEach(function (key) {
              if (_data[key]) {
                data[_aliases[key] || key] = _data[key];
              }
            });
            return data;
          } else {
            return this.toData();
          }
        }
      };

      // extend prototype with user defined properties
      Object.keys(properties).forEach(function (propKey) {
        switch (propKey) {
          case 'fields':
            _fields = properties['fields'];
            break;
          case 'aliases':
            _aliases = properties['aliases'];
            _maps = {};
            Object.keys(_aliases).forEach(function (alias) {
              _maps[_aliases[alias]] = alias;
            });
            break;
          case 'id':
            _idAttribute = properties['id'];
            break;
          default:
            prototype[propKey] = properties[propKey];
        }
      });

      model.prototype = prototype;
      return new model(data);
    }

    ModelConstructor.toData = function (doc) {
      var m = ModelConstructor(doc);
      return m.toData();
    };

    ModelConstructor.toAliasedData = function (doc) {
      var m = ModelConstructor(doc);
      return m.toAliasedData();
    };

    staticConsts && Object.keys(staticConsts).forEach(function (key) {
      ModelConstructor[key] = staticConsts[key];
    });

    models[name] = ModelConstructor;

    return ModelConstructor;
  }

  if (typeof module !== 'undefined' && module.exports) {
    exports.Model = Model;
  } else {
    var genji = window.genji || {};
    genji.Model = Model;
    window.genji = genji;
  }
})();