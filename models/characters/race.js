'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
    name: {type: String, required: true},
    speed: {type: Number, required: true},
    size: {type: String, required: true},
    abilityIncrease: {type: String, required: true},
    languages: {type: String, required: true},
    bonuses: {type: String, required: true},
});

module.exports = mongoose.model('Race', schema);