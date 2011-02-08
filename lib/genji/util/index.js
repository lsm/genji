module.exports = {
    base64: {
        encode: function(input, inputEncoding) {
            var buf = new Buffer(input, inputEncoding || 'utf8');
            return buf.toString('base64');
        },

        //  method for decoding
        decode: function(input, outputEncoding) {
            var base64 = new Buffer(input, 'base64');
            return base64.toString(outputEncoding || 'utf8');
        }
    },
    crypto: require('./crypto'),
    benchmark: require('./benchmark'),
    Datetime: require('./datetime')
}