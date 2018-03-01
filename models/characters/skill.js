'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
    name: {type: String, required: true},
    bonus: {type: String, required: true},
    slug: {type: String, required: true},
    savingThrow: {type: Boolean, required: true},
});

module.exports = mongoose.model('Skill', schema);