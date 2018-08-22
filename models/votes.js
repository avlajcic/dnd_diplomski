let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    item: { type: Schema.Types.ObjectId, ref: 'Item' },
});

module.exports = mongoose.model('Vote', schema);