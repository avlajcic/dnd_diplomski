'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
    name: {type: String, required: true},
    class: { type: Schema.Types.ObjectId, ref: 'Class' },
    race: { type: Schema.Types.ObjectId, ref: 'Race' },
    skills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
    strength: {type: Number, required: true},
    dexterity: {type: Number, required: true},
    constitution: {type: Number, required: true},
    intelligence: {type: Number, required: true},
    wisdom: {type: Number, required: true},
    charisma: {type: Number, required: true},
    level: {type: Number, required: true},
    healthPoints: {type: Number, required: true},
    armorClass: {type: Number, required: true},
    proficiency: {type: Number, required: true},
    gold: {type: Number, required: true},
    silver: {type: Number, required: true},
    copper: {type: Number, required: true},
    user: { type: Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Character', schema);