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

    /**
     * The setters of attributes.
     */
    var _setters = {};

    /**
     * The getters of attributes.
     */
    var _getters = {};

    function ModelConstructor(data) {
      /**
       * Private data holder
       */
      var _data = {};

      /**
       * True if original data has no `_idAttribute`
       */
      var noIdAttribute = !data[_idAttribute];

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
            var getter = _getters[key];
            return getter ? getter.call(this, _data[key]) : _data[key];
          } else {
            // apply attribute's setter function if any, when original data doc has no `_idAttribute`
            var setter = _setters[key];
            if (noIdAttribute && setter) {
              _data[key] = setter.call(this, value);
            } else {
              _data[key] = value;
            }
          }
        },

        toData:function (alias) {
          var data = {};
          var keys = Object.keys(_data);
          var self = this;
          if (alias === 'alias') {
            keys.forEach(function (key) {
              if (_data[key] !== undefined) {
                data[_aliases[key] || key] = self.attr(key);
              }
            });
          } else {
            keys.forEach(function (key) {
              if (_data[key] !== undefined) {
                data[_maps[key] || key] = self.attr(key);
              }
            });
          }
          return data;
        },

        /**
         * @deprecated
         */
        toAliasedData:function () {
          console.log('Warning: `Model.toAliasedData` is deprecated please use `Model.toData("alias")` instead.');
          return this.toData('alias');
        }
      };

      // extend prototype with user defined properties
      Object.keys(properties).forEach(function (propKey) {
        var notReserved = false;
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
            notReserved = true;
        }
        if (notReserved) {
          if (/^(set|get)[A-Z]+/.test(propKey)) {
            var attributeName = propKey.slice(3);
            attributeName = attributeName[0].toLowerCase() + attributeName.slice(1);
            var fn = properties[propKey];
            if (typeof fn === 'function') {
              switch(propKey.slice(0, 3)) {
                case 'set':
                  _setters[attributeName] = fn;
                  break;
                case 'get':
                  _getters[attributeName] = fn;
                  break;
              }
            }
          } else {
            prototype[propKey] = properties[propKey];
          }
        }
      });

      model.prototype = prototype;
      return new model(data);
    }

    ModelConstructor.toData = function (doc, alias) {
      var m = ModelConstructor(doc);
      return m.toData(alias);
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