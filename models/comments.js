let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    item: { type: Schema.Types.ObjectId, ref: 'Item' },
    comment: {type: String, required: true},
});

module.exports = mongoose.model('Comment', schema);