var genji = require('../index');
var assert = require('assert');
var Role = genji.Role;

exports['test Role'] = function () {

  var defaultProviders = {
    account: ['create', 'edit', 'delete']
  };

  var defaultGroups = {
    admin: 'account'
  };

  // create `role` instance with default options
  var role = new Role({
    providers: defaultProviders,
    groups: defaultGroups
  });

  // add provider `blog` with actions
  role.provide('blog', ['create', 'publish', 'edit', 'remove']);

  // `admin` is allowed to do everything in `blog`
  role.allow('admin', 'blog');

  // allow `editor` to `create` and `edit` `blog`
  role.allow('editor', {blog: ['create', 'edit']});

  // test permissions
  assert.eql(role.isAllow('admin', 'account', 'delete'), true);
  assert.eql(role.isAllow('editor', 'blog', ['create', 'edit']), true);
  assert.eql(role.isAllow('editor', 'blog', 'publish'), false);
  // multiple group, allow if any group has permission
  assert.eql(role.isAllow(['admin', 'editor'], 'blog', 'publish'), true);
  // false for not exists group
  assert.eql(role.isAllow('user', 'account'), false);
};