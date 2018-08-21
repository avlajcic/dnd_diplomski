'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true, unique: true },
    dateCreated: { type: Date, required: true, default: Date.now() },
    votes: { type: Number, required: true, default: 0 },
    type: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Item', schema);