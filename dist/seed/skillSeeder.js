'use strict';

var Skill = require('../models/characters/skill');

var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost:27017/dnd';
mongoose.Promise = global.Promise;
mongoose.connect(dbUrl, { useMongoClient: true });

var skills = [new Skill({
    name: 'Strength',
    bonus: 'str',
    slug: 'strength',
    savingThrow: true
}), new Skill({
    name: 'Dexterity',
    bonus: 'dex',
    slug: 'dexterity',
    savingThrow: true
}), new Skill({
    name: 'Constitution',
    bonus: 'con',
    slug: 'constitution',
    savingThrow: true
}), new Skill({
    name: 'Intelligence',
    bonus: 'int',
    slug: 'intelligence',
    savingThrow: true
}), new Skill({
    name: 'Wisdom',
    bonus: 'wis',
    slug: 'wisdom',
    savingThrow: true
}), new Skill({
    name: 'Charisma',
    bonus: 'cha',
    slug: 'charisma',
    savingThrow: true
}), new Skill({
    name: 'Acrobatics',
    bonus: 'dex',
    slug: 'acrobatics',
    savingThrow: false
}), new Skill({
    name: 'Animal handling',
    bonus: 'wis',
    slug: 'animal_handling',
    savingThrow: false
}), new Skill({
    name: 'Arcana',
    bonus: 'int',
    slug: 'arcana',
    savingThrow: false
}), new Skill({
    name: 'Athletics',
    bonus: 'str',
    slug: 'athletics',
    savingThrow: false
}), new Skill({
    name: 'Deception',
    bonus: 'cha',
    slug: 'deception',
    savingThrow: false
}), new Skill({
    name: 'History',
    bonus: 'int',
    slug: 'history',
    savingThrow: false
}), new Skill({
    name: 'Insight',
    bonus: 'wis',
    slug: 'insight',
    savingThrow: false
}), new Skill({
    name: 'Intimidation',
    bonus: 'cha',
    slug: 'intimidation',
    savingThrow: false
}), new Skill({
    name: 'Investigation',
    bonus: 'int',
    slug: 'investigation',
    savingThrow: false
}), new Skill({
    name: 'Medicine',
    bonus: 'wis',
    slug: 'medicine',
    savingThrow: false
}), new Skill({
    name: 'Nature',
    bonus: 'int',
    slug: 'nature',
    savingThrow: false
}), new Skill({
    name: 'Perception',
    bonus: 'wis',
    slug: 'perception',
    savingThrow: false
}), new Skill({
    name: 'Performance',
    bonus: 'cha',
    slug: 'performance',
    savingThrow: false
}), new Skill({
    name: 'Persuasion',
    bonus: 'cha',
    slug: 'persuasion',
    savingThrow: false
}), new Skill({
    name: 'Religion',
    bonus: 'int',
    slug: 'religion',
    savingThrow: false
}), new Skill({
    name: 'Sleight of hand',
    bonus: 'dex',
    slug: 'sleight_of_hand',
    savingThrow: false
}), new Skill({
    name: 'Stealth',
    bonus: 'dex',
    slug: 'stealth',
    savingThrow: false
}), new Skill({
    name: 'Survival',
    bonus: 'wis',
    slug: 'survival',
    savingThrow: false
})];

var done = 0;
for (var i = 0; i < skills.length; i++) {
    skills[i].save(function (err, result) {
        done++;
        if (done === skills.length) {
            dc();
        }
    });
}

function dc() {
    console.log("Done");
    mongoose.disconnect();
}