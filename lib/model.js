// # model.js - Handle your data logic #
!(function () {

  // ## Internal objects and env compatiblity ##

  // cache for defined models
  var models = {};
  // detect if we are in commonjs env
  var isCommonJS = typeof module !== 'undefined' && module.exports;
  // the `extend` function for different env
  var extend;
  if (isCommonJS) {
    extend = require('./util').extend;
    var util = require('util');
    exports.Model = Model;
  } else {
    var genji = window.genji || {};
    extend = genji.extend;
    genji.Model = Model;
    window.genji = genji;
  }

  // ## Model definition function ##
  function Model(name, properties, staticProperties) {

    if (models[name] && !properties) {
      // load Model from cache
      return models[name];
    }

    // ### Class level attributes ###

    //Model required fields
    ModelConstructor._requires = [];
    //Model field info and validators
    ModelConstructor._fields = {};
    // Model alias info
    ModelConstructor._aliases = {id: '_id'};
    ModelConstructor._maps = {_id: 'id'};
    // The setters of attributes.
    ModelConstructor._setters = {};
    // The getters of attributes.
    ModelConstructor._getters = {};
    // The unique id of the document record, default is `_id`
    ModelConstructor._idAttribute = '_id';
    // The outer `this` of the `ModelContructor`
    var _global = this;

    // ### The constructor function of your defined model ###
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
      var ctor = ModelConstructor;
      // save constructor to instance object
      this._ctor = ctor;
      // mark that we are initializing, changed fields should not be recorded.
      this._initialized = false;
      // tell if the input data has `idAttribute` or not. (default `idAttribute` field is `_id`)
      this._noIdAttribute = !data[ctor._idAttribute];
      // object to hold the document data
      this._data = {};
      // object contains the invaild fields and values and reasons
      this._invalidFields = {count: 0, fields: {}};
      // object contains the changed field/value pairs
      this._changedFields;
      // check for required fields
      var self = this;
      if (Array.isArray(ctor._requires) && ctor._requires.length > 0) {
        ctor._requires.forEach(function (fieldName) {
          if (!data.hasOwnProperty(fieldName)) {
            // missing field found
            self._invalidFields.count++;
            self._invalidFields.fields[fieldName] = {error:Model.ERROR_FIELD_MISSING};
          }
        });
      }
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

    // valid attribute value, return false if the value is valid.
    function _validateField(ModelCtor, fieldName, value) {
      if (!ModelCtor._fields) {
        return false;
      }
      var validator = ModelCtor._fields[fieldName];
      if (!validator) return false;

      var validatorType = typeof validator;
      if (validatorType === 'string') {
        switch(validator) {
          case 'number':
          case 'string':
            return typeof value === validator ? false : Model.ERROR_FIELD_TYPE;
          case 'array':
            return Array.isArray(value) ? false : Model.ERROR_FIELD_TYPE;
          case 'regexp':
            return util.isRegExp(value) ? false : Model.ERROR_FIELD_TYPE;
          case 'date':
            return util.isDate(value) ? false : Model.ERROR_FIELD_TYPE;
          case 'bool':
            return value === true || value === false ? false : Model.ERROR_FIELD_TYPE;
        }
      } else if (validatorType === 'function') {
        return validator(value);
      }
      return Model.ERROR_VALIDATOR;
    }

    // ### Buildin methods of model ###
    ModelConstructor.prototype = {
      attr:function (key, value) {
        if (Array.isArray(key)) {
          var obj = {};
          key.forEach(function (keyName) {
            obj[keyName] = this.attr(keyName);
          }, this);
          return obj;
        }
        var _data = this._data;
        var ctor = this._ctor;
        // use original key name
        var aliasKey = ctor._aliases[key] || key;
        if (typeof value === 'undefined') {
          var getter = ctor._getters[key];
          if (key === '_id') {
            console.log(ctor._maps);
          }
          return getter ? getter.call(this, _data[aliasKey]) : _data[aliasKey];
        } else {
          var isInvalid = _validateField(ctor, key, value);
          if (isInvalid) {
            this._invalidFields.count++;
            this._invalidFields.fields[key] = {
              error:isInvalid === true ? Model.ERROR_FIELD_INVALID : isInvalid,
              value:value
            };
          } else {
            if (this.getInvalidFields().hasOwnProperty(key)) {
              // if this field is invalid previously, then delete the field from invalidFields hash.
              this._invalidFields.count--;
              delete this._invalidFields.fields[key];
            }
            // get setter function from setters hash
            var setter = ctor._setters[key];
            // apply attribute's setter function if any, when original data doc has no `_idAttribute`
            var newValue = this._noIdAttribute && setter ? setter.call(this, value) : value;
            // save the changed value if we're not initializing.
            if (this._initialized && _data[aliasKey] !== newValue) {
              this._changedFields = this._changedFields || {};
              this._changedFields[key] = newValue;
            }
            _data[aliasKey] = newValue;
          }
        }
        return this;
      },

      isValid:function () {
        return this._invalidFields.count === 0;
      },

      getInvalidFields:function () {
        return this._invalidFields.fields;
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
        var _maps = this._ctor._maps;
        keys.forEach(function (key) {
          if (_data[key] !== undefined) {
            data[_maps[key] || key] = self.attr(_maps[key] || key);
          }
        });
        return data;
      },

      toDoc:function () {
        if (!this.isValid()) {
          // return false if we have invalid field
          return false;
        }
        var _data = this._data;
        var data = {};
        var keys = Object.keys(_data);
        var self = this;
        var _aliases = this._ctor._aliases;
        var _maps = this._ctor._maps;
        keys.forEach(function (key) {
          if (_data[key] !== undefined) {
            data[_aliases[key] || key] = self.attr(_maps[key] || key);
          }
        });
        return data;
      }
    };

    ModelConstructor.toData = function (doc) {
      var m = new ModelConstructor(doc);
      return m.toData();
    };

    ModelConstructor.toDoc = function (doc) {
      var m = new ModelConstructor(doc);
      return m.toDoc();
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
          case 'requires':
            ModelCtor._requires = properties['requires'];
            break;
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
            ModelCtor._idAttribute = properties['id'];
            break;
          default:
            notReserved = true;
        }
        if (notReserved) {
          if (/^(set|get)[A-Z]+/.test(propKey)) {
            var attributeName = propKey.slice(3);
            attributeName = attributeName[0].toLowerCase() + attributeName.slice(1);
            if (ModelCtor._fields.hasOwnProperty(attributeName)) {
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

    //Model name
    ModelConstructor._name = name;

    models[name] = ModelConstructor;
    return ModelConstructor;
  }

  // ## Model error code ##
  Model.ERROR_FIELD_MISSING = 1001;
  Model.ERROR_FIELD_TYPE = 1002;
  Model.ERROR_FIELD_INVALID = 1003;
  Model.ERROR_VALIDATOR = 1004;
})();