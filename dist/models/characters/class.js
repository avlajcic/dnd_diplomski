'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    name: { type: String, required: true },
    hitDice: { type: String, required: true },
    armor: { type: String, required: true },
    weapons: { type: String, required: true },
    tools: { type: String, required: true },
    savingThrows: { type: String, required: true },
    skills: { type: String, required: true }
});

module.exports = mongoose.model('Class', schema);