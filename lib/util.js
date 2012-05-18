

function toArray(obj) {
  var len = obj.length,
      arr = new Array(len);
  for (var i = 0; i < len; ++i) {
    arr[i] = obj[i];
  }
  return arr;
}

function extend(obj, props) {
  var propsObj = toArray(arguments);
  propsObj.shift();
  propsObj.forEach(function(props) {
    if (props) {
      Object.keys(props).forEach(function(key) {
        obj[key] = props[key];
      });
    }
  });
  return obj;
}

function byteLength(str) {
  if (!str) {
    return 0;
  }
  var matched = str.match(/[^\x00-\xff]/g);
  return (str.length + (!matched ? 0 : matched.length));
}

exports.extend = extend;
exports.toArray = toArray;
exports.byteLength = byteLength;