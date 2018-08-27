'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('User', schema);