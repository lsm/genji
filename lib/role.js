var extend = require('./util').extend;


function Role(options) {
  this.provides = {};
  this.groups = {};

  options = options || {};
  if (options.providers) {
    this.provide(options.providers);
  }
  if (options.groups) {
    Object.keys(options.groups).forEach(function (groupName) {
      this.allow(groupName, options.groups[groupName]);
    }, this);
  }
}

Role.prototype = {

  provide:function (name, actions) {
    Array.isArray(actions) || (actions = [actions]);
    if (typeof name === 'string') {
      this.provides[name] = actions;
    } else {
      extend(this.provides, name);
    }
  },

  allow:function (group, allows) {
    var allowed = {};
    if (typeof allows === 'string') {
      allowed[allows] = this.provides[allows];
    } else {
      allowed = allows;
    }
    this.groups[group] || (this.groups[group] = {});
    extend(this.groups[group], allowed);
  },

  isAllow:function (group, provider, actions) {
    if (!actions) {
      actions = this.provides[provider];
    }
    if (!Array.isArray(actions)) {
      actions = [actions];
    }

    function testSingleGroup(role, groupName, providerName, providerActions) {
      // signle group
      var groupAllowed = role.groups[groupName];
      if (!groupAllowed) return false;
      var allowed = groupAllowed[providerName];
      if (!allowed || allowed.length === 0) return false;
      return providerActions.every(function (action) {
        return allowed.indexOf(action) > -1;
      });
    }

    if (Array.isArray(group)) {
      return group.some(function (groupName) {
        return testSingleGroup(this, groupName, provider, actions);
      }, this);
    } else {
      return testSingleGroup(this, group, provider, actions);
    }
  }
};


exports.Role = Role;