let Race = require('../models/characters/race');

let mongoose = require('mongoose');
let dbUrl = 'mongodb://localhost:27017/dnd';
mongoose.Promise = global.Promise;
mongoose.connect(dbUrl, {useMongoClient: true});

let races = [
    new Race({
        name: 'Hill Dwarf',
        speed: 25,
        size: 'Medium',
        abilityIncrease: '+2 CON, +1 WIS',
        languages: 'Common, Dwarvish',
        bonuses: 'Darkvision. Accustomed to life underground, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it w ere dim light. You can’t discern color in darkness, only shades of gray.\n' +
        'Dwarven Resilience. You have advantage on saving throws against poison, and you have resistance against poison damage.\n' +
        'Dwarven Combat Training. You have proficiency with the battleaxe, handaxe, throwing hammer, and warhammer.\n' +
        'Dwarven Toughness. Your hit point maximum increases by 1, and it increases by 1 every time you gain a level.',
    }),
    new Race({
        name: 'Mountain Dwarf',
        speed: 25,
        size: 'Medium',
        abilityIncrease: '+2 CON, +2 STR',
        languages: 'Common, Dwarvish',
        bonuses: 'Darkvision. Accustomed to life underground, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it w ere dim light. You can’t discern color in darkness, only shades of gray.\n' +
        'Dwarven Resilience. You have advantage on saving throws against poison, and you have resistance against poison damage.\n' +
        'Dwarven Combat Training. You have proficiency with the battleaxe, handaxe, throwing hammer, and warhammer.\n' +
        'Dwarven Armor Training. You have proficiency with light and medium armor.',
    }),
];

let done = 0;
for (let i = 0; i < races.length; i++){
    races[i].save(function (err, result) {
        done++;
        if (done === races.length){
            dc();
        }
    });
}

function dc() {
    console.log("Done");
    mongoose.disconnect();
}