module.exports = {
    base64: {
        encode: function(input) {
            var buf = new Buffer(input, 'utf8')
            return buf.toString('base64');
        },

        //  method for decoding
        decode: function(input) {
            var base64 = new Buffer(input, 'base64');
            return base64.toString('utf8');
        }
    },
    crypto: require('./crypto'),
    benchmark: require('./benchmark')
}