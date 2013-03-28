var genji = require('../index');
var assert = require('assert');
var Model = genji.Model;

describe('Model', function () {
  it('should define model', function () {
    var Post = Model({
      name: 'Post',
      fields: {
        id: 'number',
        title: 'string',
        tags: 'array',
        created: 'date',
        draft: 'bool',
        reg: 'regexp',
        invalid: {},
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
      content: 'invalid content',
      tags: ['test'],
      created: new Date(),
      draft: 'false',
      reg: /test/g,
      invalid: 'invalid'
    });

    assert.equal(post.isValid(), false);
    assert.equal(post.toDoc(), false);
    assert.equal(post.get('id'), 'postId_10');
    assert.equal(post.get('title'), 'EXAMPLE POST TITLE');
    assert.deepEqual(post.get(['id', 'title']), {id: 'postId_10', title: 'EXAMPLE POST TITLE'});

    var postDoc = post.toData();
    assert.equal(postDoc, false);
    assert.equal(post.STATUS_DRAFT, 0);
    var invalidFields = post.getInvalidFields();
    assert.equal(invalidFields.content.error, 'content should be longer than 20 characters');
    assert.equal(invalidFields.content.value, 'invalid content');
    assert.equal(post.ERROR_VALIDATOR, invalidFields.invalid.error);
    assert.equal(post.ERROR_FIELD_TYPE, invalidFields.draft.error);
    assert.equal('false', invalidFields.draft.value);
    post.set('draft', true);
    assert.equal('undefined', typeof invalidFields.draft);

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

    assert.equal(postExtended.STATUS_DRAFT, 0);
    assert.equal(postExtended.STATUS_PUBLISHED, 1);
    assert.equal(postExtended.isValid(), true);
    assert.equal(postExtended.get('content'), 'is a valid post content');
    postExtended.set('content', 'another valid post content');
    assert.equal(postExtended.get('content'), 'another valid post content');
    assert.equal(postExtended.changed().content, 'another valid post content');

    var postExtendedDoc = postExtended.toDoc();
    assert.equal(postExtendedDoc._id, 'postId_20');
    assert.equal(postExtendedDoc.title, 'ANOTHER POST');
    assert.equal(postExtendedDoc.postAuthor, 'post author');

    // test `toDoc(keys)`
    var selectedFieldsDoc = postExtended.toDoc(['id', 'title', 'author']);
    assert.equal(selectedFieldsDoc._id, 'postId_20');
    assert.equal(selectedFieldsDoc.title, 'ANOTHER POST');
    assert.equal(selectedFieldsDoc.postAuthor, 'post author');
    assert.equal(selectedFieldsDoc.hasOwnProperty('author'), false);
    assert.equal(selectedFieldsDoc.hasOwnProperty('content'), false);

    // test `toData(keys)`
    var selectedFieldsData = postExtended.toData(['id', 'author', 'content']);
    assert.equal(selectedFieldsData.id, 'postId_20');
    assert.equal(selectedFieldsData.author, 'post author');
    assert.equal(selectedFieldsData.content, 'another valid post content');
    assert.equal(selectedFieldsData.hasOwnProperty('title'), false);

    var postExtendedInvalid = new PostExtended({
      id: 21,
      content: 'is a valid post content, but not a valid model',
      author: 'post author'
    });
    assert.equal(postExtendedInvalid.isValid(), false);

    var postExtended2 = new PostExtended({
      _id: 20,
      title: 'another post',
      content: 'is a valid post content',
      postAuthor: 'post author'
    });
    assert.equal(postExtended2.get('author'), 'post author');
  });

});