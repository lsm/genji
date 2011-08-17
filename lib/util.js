

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

exports.extend = extend;
exports.toArray = toArray;