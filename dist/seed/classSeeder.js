'use strict';

var Class = require('../models/characters/class');

var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost:27017/dnd';
mongoose.Promise = global.Promise;
mongoose.connect(dbUrl, { useMongoClient: true });

var classes = [new Class({
    name: 'Barbarian',
    hitDice: '1d12',
    armor: 'Light armor, medium armor, shields.',
    weapons: 'Simple weapons, martial weapons.',
    tools: 'None',
    savingThrows: 'Strength, Constitution',
    skills: 'Choose two from Animal Handling, Athletics, Intimidation, Nature, Perception, and Survival'
}), new Class({
    name: 'Bard ',
    hitDice: '1d8',
    armor: 'Light armor.',
    weapons: 'Simple weapons, hand crossbows, longswords, rapiers, shortswords.',
    tools: 'Three musical instruments of your choice.',
    savingThrows: 'Dexterity, Charisma',
    skills: 'Choose any three'
})];

var done = 0;
for (var i = 0; i < classes.length; i++) {
    classes[i].save(function (err, result) {
        done++;
        if (done === classes.length) {
            dc();
        }
    });
}

function dc() {
    console.log("Done");
    mongoose.disconnect();
}