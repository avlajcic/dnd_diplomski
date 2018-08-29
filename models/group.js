'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
    name: {type: String, required: true},
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    characters: [{ type: Schema.Types.ObjectId, ref: 'Character' }],
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    dm: { type: Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Group', schema);