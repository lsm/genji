function base64Encode(input, inputEncoding) {
  var buf = new Buffer(input, inputEncoding || 'utf8');
  return buf.toString('base64');
}


function base64Decode(input, outputEncoding) {
  var base64 = new Buffer(input, 'base64');
  return base64.toString(outputEncoding || 'utf8');
}

function toArray(obj) {
  var len = obj.length,
      arr = new Array(len);
  for (var i = 0; i < len; ++i) {
    arr[i] = obj[i];
  }
  return arr;
}

function extend(obj, props) {
  if (props) {
    Object.keys(props).forEach(function(key) {
      obj[key] = props[key];
    });
  }
  return obj;
}

exports.base64Encode = base64Encode;
exports.base64Decode = base64Decode;
exports.extend = extend;
exports.toArray = toArray;