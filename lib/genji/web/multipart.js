// simple multipart parser support uploading file in one chunk (< 40k)
var boundaryExpression = /boundary=([^;]+)/i,
fieldExpression = /Content-Disposition: form-data; name="([a-zA-Z0-9]+)"; filename="(.*)"/i,
CRLF = '\r\n';

function check(headers) {
    return headers.hasOwnProperty('content-type') ? headers['content-type'].search('multipart/form-data') > -1 : false;
}


function parse(field, inStream, callback) {
    var counter = 0;
    var buf = '';
    var boundary = boundaryExpression.exec(inStream.headers['content-type']);

    var lb = '--' + boundary[1];
    var endb = lb + '--';
    inStream.addListener('data', function(data) {
        if (counter == 0) {
            counter++;
            buf = data;
        } else {
            callback('multiple chunks received');
        }
    });
    inStream.addListener('end', function() {
        if (counter === 1) {            
            dump(buf)
            field = fieldExpression.exec(buf);
            if (field && field[1] == field) {
                //callback(null, field[2]);
            }
            
        }
    });
}

exports.parse = parse;