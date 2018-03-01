'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    name: { type: String, required: true },
    bonus: { type: String, required: true },
    slug: { type: String, required: true },
    savingThrow: { type: Boolean, required: true }
});

module.exports = mongoose.model('Skill', schema);