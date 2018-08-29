'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    name: { type: String, required: true },
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    characters: [{ type: Schema.Types.ObjectId, ref: 'Character' }],
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    dm: { type: Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Group', schema);