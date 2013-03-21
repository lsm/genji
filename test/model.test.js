var genji = require('../index');
var assert = require('assert');
var Model = genji.Model;

exports['test model definition'] = function () {

  var Post = Model({
    name: 'Post',
    fields: {
      id: 'number',
      title: 'string',
      content: function (content) {
        if (typeof content !== 'string') {
          return 'content should be string';
        } else if (content.length <= 20) {
          return 'content should be longer than 20 characters';
        }
      }
    },
    aliases: {id: '_id'},
    setTitle: function (title) {
      return title.toUpperCase();
    },
    getId: function (id) {
      return 'postId_' + id;
    },
    STATUS_DRAFT: 0
  });

  var post = new Post({
    id: 10,
    title: 'example post title',
    content: 'invalid content'
  });

  assert.eql(post.isValid(), false);
  assert.eql(post.get('id'), 'postId_10');
  assert.eql(post.get('title'), 'EXAMPLE POST TITLE');
  var postDoc = post.toData();
  assert.eql(postDoc, false);
  assert.eql(post.STATUS_DRAFT, 0);
  var invalidFields = post.getInvalidFields();
  assert.eql(invalidFields.content.error, 'content should be longer than 20 characters');
  assert.eql(invalidFields.content.value, 'invalid content');

  var PostExtended = Post({
    name: 'PostExtended',
    requires: ['title', 'content'],
    fields: {
      content: function (content) {
        if (typeof content !== 'string') {
          return 'content should be string';
        } else if (content.length <= 10) {
          return 'content should be longer than 10 characters';
        }
      },
      author: function (author) {
        return author !== 'post author';
      }
    },
    aliases: {author: 'postAuthor'},
    STATUS_PUBLISHED: 1
  });

  var postExtended = new PostExtended({
    id: 20,
    title: 'another post',
    content: 'is a valid post content',
    author: 'post author'
  });

  assert.eql(postExtended.STATUS_DRAFT, 0);
  assert.eql(postExtended.STATUS_PUBLISHED, 1);
  assert.eql(postExtended.isValid(), true);
  assert.eql(postExtended.get('content'), 'is a valid post content');
  postExtended.set('content', 'another valid post content');
  assert.eql(postExtended.get('content'), 'another valid post content');
  assert.eql(postExtended.changed(), {'content': 'another valid post content'});

  var postExtendedDoc = postExtended.toDoc();
  assert.eql(postExtendedDoc._id, 'postId_20');
  assert.eql(postExtendedDoc.title, 'ANOTHER POST');
  assert.eql(postExtendedDoc.postAuthor, 'post author');

  // test `toDoc(keys)`
  var selectedFieldsDoc = postExtended.toDoc(['id', 'title', 'author']);
  assert.eql(selectedFieldsDoc._id, 'postId_20');
  assert.eql(selectedFieldsDoc.title, 'ANOTHER POST');
  assert.eql(selectedFieldsDoc.postAuthor, 'post author');
  assert.eql(selectedFieldsDoc.hasOwnProperty('author'), false);
  assert.eql(selectedFieldsDoc.hasOwnProperty('content'), false);

  // test `toData(keys)`
  var selectedFieldsData = postExtended.toData(['id', 'author', 'content']);
  assert.eql(selectedFieldsData.id, 'postId_20');
  assert.eql(selectedFieldsData.author, 'post author');
  assert.eql(selectedFieldsData.content, 'another valid post content');
  assert.eql(selectedFieldsData.hasOwnProperty('title'), false);

  var postExtendedInvalid = new PostExtended({
    id: 21,
    content: 'is a valid post content, but not a valid model',
    author: 'post author'
  });
  assert.eql(postExtendedInvalid.isValid(), false);

  var postExtended2 = new PostExtended({
    _id: 20,
    title: 'another post',
    content: 'is a valid post content',
    postAuthor: 'post author'
  });
  assert.eql(postExtended2.get('author'), 'post author');
};