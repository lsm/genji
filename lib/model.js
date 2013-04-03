/**
 * Database agnostic data model class
 */

/**
 * Module dependencies
 */
var Klass = require('./klass').Klass;
var extend = require('./util').extend;
var util = require('util');

/**
 * Constructor function of Model
 * @param data {Object} Data that need to be handled by Model
 * @constructor
 * @public
 */

function Model(data) {
  // mark that we are initializing, changed fields should not be recorded.
  this.initialized = false;
  // tell if the input data has `idAttribute` or not. (default `idAttribute` field is `_id`)
  this.noIdAttribute = !data[this.idAttribute];
  // object to hold the document data
  this.data = {};
  // object contains the invaild fields and values and reasons
  this.invalidFields = {count: 0, fields: {}};
  this.setters = this.setters || {};
  this.getters = this.getters || {};
  this.aliases = this.aliases || {};
  // object contains the changed field/value pairs
  this.changedFields = false;

  // check for required fields
  var self = this;
  if (Array.isArray(this.requires) && this.requires.length > 0) {
    this.requires.forEach(function (fieldName) {
      if (!data.hasOwnProperty(fieldName)) {
        // missing field found
        self.invalidFields.count++;
        self.invalidFields.fields[fieldName] = {error: this.ERROR_FIELD_MISSING};
      }
    });
  }
  // set input data to internal `this.data` object, apply validators and setters.
  Object.keys(data).forEach(function (key) {
    self.set(key, data[key]);
  });
  // mark that the initialization is finished
  this.initialized = true;
}

/**
 * Model prototype object
 */

Model.prototype = {

  /**
   * Name of the Model
   */
  name: 'Model',
  idAttribute: '_id',

  /**
   * Data field setter function.
   *
   * @param key {String} Name of the field
   * @param value {*} Value of the field
   * @returns {*} "this"
   * @public
   */

  set: function (key, value) {
    var isInvalid = this.validateField(key, value);
    if (isInvalid) {
      this.invalidFields.count++;
      this.invalidFields.fields[key] = {
        error: isInvalid === true ? this.ERROR_FIELD_INVALID : isInvalid,
        value: value
      };
    } else {
      var data = this.data;
      var aliasKey = this.aliases[key] || key;
      if (this.getInvalidFields().hasOwnProperty(key)) {
        // if this field is invalid previously, then delete the field from invalidFields hash.
        this.invalidFields.count--;
        delete this.invalidFields.fields[key];
      }
      // get setter function from setters hash
      var setter = this.setters[key];
      // apply attribute's setter function if any, when original data doc has no `_idAttribute`
      var newValue = this.noIdAttribute && setter ? setter.call(this, value) : value;
      // save the changed value if we're not initializing.
      if (this.initialized && data[aliasKey] !== newValue) {
        this.changedFields = this.changedFields || {};
        this.changedFields[key] = newValue;
      }
      data[aliasKey] = newValue;
    }
    return this;
  },

  /**
   * Get field value by name.
   *
   * @param key {String|Array} Name of the field or array of field names
   * @returns {*} Field value or field/value hash if key is Array
   * @public
   */

  get: function (key) {
    if (Array.isArray(key)) {
      var obj = {};
      key.forEach(function (keyName) {
        obj[keyName] = this.get(keyName);
      }, this);
      return obj;
    }
    var data = this.data;
    // use original key name
    var aliasKey = this.aliases[key] || key;
    var getter = this.getters[key];
    return getter ? getter.call(this, data[aliasKey]) : data[aliasKey];
  },

  /**
   * Validate field base on the "this.fields" object.
   *
   * @param fieldName {String} Name of the field
   * @param value {*} Value that need to be validated
   * @returns {Boolean|*} Returns "false" if validated successfully otherwise returns error code
   */

  validateField: function (fieldName, value) {
    if (!this.fields) {
      return false;
    }

    var field = this.maps[fieldName] || fieldName;
    var validator = this.fields[field];

    if (!validator) {
      return false;
    }

    var validatorType = typeof validator;
    if ('string' === validatorType) {
      switch (validator) {
        case 'number':
        case 'string':
          return validator === typeof value ? false : this.ERROR_FIELD_TYPE;
        case 'array':
          return Array.isArray(value) ? false : this.ERROR_FIELD_TYPE;
        case 'regexp':
          return util.isRegExp(value) ? false : this.ERROR_FIELD_TYPE;
        case 'date':
          return util.isDate(value) ? false : this.ERROR_FIELD_TYPE;
        case 'bool':
          return value === true || value === false ? false : this.ERROR_FIELD_TYPE;
      }
    } else if (validatorType === 'function') {
      return validator(value);
    }
    return this.ERROR_VALIDATOR;
  },

  /**
   * Check if current data in model is valid or not.
   *
   * @returns {Boolean}
   * @public
   */

  isValid: function () {
    return this.invalidFields.count === 0;
  },

  /**
   * Get invalid data fields
   *
   * @returns {Boolean|Object} False if all fields are valid otherwise object.
   * @public
   */

  getInvalidFields: function () {
    return this.invalidFields.count === 0 ? false : this.invalidFields.fields;
  },

  /**
   * Get the changed fields after model initialized.
   *
   * @returns {*}
   * @public
   */

  changed: function () {
    return this.changedFields;
  },

  /**
   * Return data with fields' name that you want to present to end-user.
   *
   * @param [keys] {Array} Array of fields you want to get, if not supplied return all fields.
   * @returns {Object|Boolean} False if model has invalid field
   * @public
   */

  toData: function (keys) {
    if (!this.isValid()) {
      // return false if we have invalid field
      return false;
    }
    var _data = this.data;
    var data = {};
    keys = keys || Object.keys(_data);
    var self = this;
    var _maps = this.maps;
    keys.forEach(function (key) {
      data[_maps[key] || key] = self.get(_maps[key] || key);
    });
    return data;
  },

  /**
   * Return data with fields' name that you want to save to database.
   *
   * @param [keys] {Array} Array of fields you want to get, if not supplied return all fields.
   * @returns {Object|Boolean} False if model has invalid field
   * @public
   */

  toDoc: function (keys) {
    if (!this.isValid()) {
      // return false if we have invalid field
      return false;
    }
    var _data = this.data;
    var doc = {};
    keys = keys || Object.keys(_data);
    var self = this;
    var _aliases = this.aliases;
    var _maps = this.maps;
    keys.forEach(function (key) {
      doc[_aliases[key] || key] = self.get(_maps[key] || key);
    });
    return doc;
  },

  /**
   * Error codes.
   */

  ERROR_FIELD_MISSING: 1001,
  ERROR_FIELD_TYPE: 1002,
  ERROR_FIELD_INVALID: 1003,
  ERROR_VALIDATOR: 1004
};

/**
 * Model inherits function
 *
 * @param prototype {Object} Prototype object of parent class
 * @param subModule {Object}
 * @private
 */

function modelInherits(prototype, subModule) {
  Object.keys(subModule).forEach(function (propKey) {
    var notReserved = false;
    switch (propKey) {
      case 'name':
      case 'requires':
        prototype[propKey] = subModule[propKey];
        break;
      case 'fields':
        prototype.fields = extend({}, prototype.fields, subModule.fields);
        break;
      case 'aliases':
        var aliases = extend({}, prototype.aliases, subModule.aliases);
        var maps = {};
        Object.keys(aliases).forEach(function (alias) {
          maps[aliases[alias]] = alias;
        });
        prototype.aliases = aliases;
        prototype.maps = maps;
        break;
      case 'id':
        prototype.idAttribute = subModule.id;
        break;
      default:
        notReserved = true;
    }
    if (notReserved) {
      if (/^(set|get)[A-Z]+/.test(propKey)) {
        var attributeName = propKey.slice(3);
        attributeName = attributeName[0].toLowerCase() + attributeName.slice(1);
        if (prototype.fields && prototype.fields.hasOwnProperty(attributeName)) {
          // field is defined, this should be a setter/getter for attribute
          var fn = subModule[propKey];
          if (typeof fn === 'function') {
            switch (propKey.slice(0, 3)) {
              case 'set':
                prototype.setters = prototype.setters || {};
                prototype.setters[attributeName] = fn;
                break;
              case 'get':
                prototype.getters = prototype.getters || {};
                prototype.getters[attributeName] = fn;
                break;
            }
          }
          return;
        }
      }
      prototype[propKey] = subModule[propKey];
    }
  });
}

/**
 * Module exports
 */

exports.Model = Klass(Model, null, modelInherits);