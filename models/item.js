let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
    name: {type: String, required: true},
    description: {type: String, required: true, unique: true},
    dateCreated: {type: Date, required: true, default: Date.now()},
    votes: {type: Number, required: true, default: 0},
    type: {type: String, required: true},
    user: { type: Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Item', schema);