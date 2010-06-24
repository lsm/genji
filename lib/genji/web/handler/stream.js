/**
 * @draft
 */
var Stream = {

    init: function(request, response) {
        this._super(request, response);
        this._onData(true);
    },

    _write: function(data, buffer) {
        // @todo send header if necessary
        data = typeof data === "string" ? data : JSON.stringify(data);
        buffer ? this._writeBuffer.push(data) : this.response.write(data, "utf8");
    },

    write: function(data) {
        this._write(data);
    },

    buffer: function(data) {
        this._write(data, true);
    },

    flush: function(data) {
        data && this._write(data, true);
        this._write(this._writeBuffer.join());
    }
}