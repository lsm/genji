!(function () {

  var models = {};

  var isNode = typeof module !== 'undefined' && module.exports;
  var extend;
  if (isNode) {
    extend = require('./util').extend;
    exports.Model = Model;
  } else {
    var genji = window.genji || {};
    genji.Model = Model;
    window.genji = genji;
  }

  function Model(name, properties, staticProperties) {

    if (models[name] && !properties) {
      // load Model from cache
      return models[name];
    }

    /**
     * Private model field info
     */
    ModelConstructor._fields = {};

    /**
     * Private model alias info
     */
    ModelConstructor._aliases = {};
    ModelConstructor._maps = {};

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
    ModelConstructor._setters = {};

    /**
     * The getters of attributes.
     */
    ModelConstructor._getters = {};

    /**
     * The outer `this` of the `ModelContructor`
     */
    var _global = this;

    function ModelConstructor(data, properties, staticProperties) {
      if (_global === this) {
        // subclassing a defined Model
        var modelName = data;
        // override parent instance/static properties
        var SubModel = Model(modelName,
          extend({}, ModelConstructor.prototype, properties),
          extend({}, ModelConstructor, staticProperties)
        );
        return SubModel;
      }
      // mark that we are initializing, changed fields should not be recorded.
      this._initialized = false;
      // tell if the input data has `idAttribute` or not. (default `idAttribute` field is `_id`)
      this._noIdAttribute = !data[_idAttribute];
      // object to hold the document data
      this._data = {};
      // object contains the invaild fields and values
      this._invalidFields;
      // object contains the changed field/value pairs
      this._changedFields;
      // set input data to internal `this._data` object, apply validators and setters.
      Object.keys(data).forEach(function (key) {
        this.attr(key, data[key]);
      }, this);
      // call customized constructor function
      if (typeof this.init === 'function') {
        this.init(this._data);
      }
      // mark that the initialization is finished
      this._initialized = true;
    }

    function _validateField(ModelCtor, fieldName, value) {
      if (!ModelCtor._fields) {
        return true;
      }
      var validator = ModelCtor._fields[fieldName];
      switch(typeof validator) {
        case 'string':
          return typeof value === validator;
        case 'function':
          return validator(value);
        default:
          return true;
      }
    }

    ModelConstructor.prototype = {
      attr:function (key, value) {
        var _data = this._data;
        if (typeof value === 'undefined') {
          var getter = ModelConstructor._getters[key];
          return getter ? getter.call(this, _data[key]) : _data[key];
        } else {
          // apply attribute's setter function if any, when original data doc has no `_idAttribute`
          if (_validateField(ModelConstructor, key, value)) {
            // validate data
            var setter = ModelConstructor._setters[key];
            var newValue = this._noIdAttribute && setter ? setter.call(this, value) : value;
            if (this._initialized && _data[key] !== newValue) {
              this._changedFields = this._changedFields || {};
              this._changedFields[key] = newValue;
            }
            _data[key] = newValue;
          } else {
            this._invalidFields = this._invalidFields || {};
            this._invalidFields[key] = value;
          }
        }
      },

      isValid:function () {
        return !this._invalidFields;
      },

      getInvalidFields:function () {
        return this._invalidFields;
      },

      changed:function () {
        return this._changedFields;
      },

      toData:function (alias) {
        if (!this.isValid()) {
          // return false if we have invalid field
          return false;
        }
        var _data = this._data;
        var data = {};
        var keys = Object.keys(_data);
        var self = this;
        if (alias === 'alias') {
          var _aliases = ModelConstructor._aliases;
          keys.forEach(function (key) {
            if (_data[key] !== undefined) {
              data[_aliases[key] || key] = self.attr(key);
            }
          });
        } else {
          var _maps = ModelConstructor._maps;
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
        console.log('Warning: `model.toAliasedData` is deprecated please use `model.toData("alias")` instead.');
        return this.toData('alias');
      }
    };

    ModelConstructor.toData = function (doc, alias) {
      var m = new ModelConstructor(doc);
      return m.toData(alias);
    };

    /**
     * @deprecated
     */
    ModelConstructor.toAliasedData = function (doc) {
      var m = new ModelConstructor(doc);
      return m.toAliasedData();
    };

    // extend static properties
    extend(ModelConstructor, staticProperties);
    // extend Model and instance properties
    _extend(ModelConstructor, properties);

    // extend prototype with user defined properties
    function _extend(ModelCtor, properties) {
      Object.keys(properties).forEach(function (propKey) {
        var notReserved = false;
        switch (propKey) {
          case 'fields':
            extend(ModelCtor._fields, properties['fields']);
            break;
          case 'aliases':
            var _aliases = extend(ModelCtor._aliases, properties['aliases']);
            var _maps = {};
            Object.keys(_aliases).forEach(function (alias) {
              _maps[_aliases[alias]] = alias;
            });
            ModelCtor._aliases = _aliases;
            ModelCtor._maps = _maps;
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
            if (ModelCtor._fields[attributeName]) {
              // field is defined, this should be a setter/getter for attribute
              var fn = properties[propKey];
              if (typeof fn === 'function') {
                switch (propKey.slice(0, 3)) {
                  case 'set':
                    ModelCtor._setters[attributeName] = fn;
                    break;
                  case 'get':
                    ModelCtor._getters[attributeName] = fn;
                    break;
                }
              }
              return;
            }
          }
          ModelCtor.prototype[propKey] = properties[propKey];
        }
      });
    }

    models[name] = ModelConstructor;
    return ModelConstructor;
  }
})();