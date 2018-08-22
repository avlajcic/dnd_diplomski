let express = require('express');
let router = express.Router();
let bodyParser = require("body-parser");
let bcrypt = require('bcrypt');
let validator = require('validator');

//DB
let mongoose = require('mongoose');
mongoose.Promise = global.Promise;
let dbUrl = process.env.DB_URL;
mongoose.connect(dbUrl, {useMongoClient: true});

//Models
let User = require('../models/user');
let Race = require('../models/characters/race');
let Class = require('../models/characters/class');
let Skill = require('../models/characters/skill');
let Item = require('../models/item');
let Vote = require('../models/votes');
let Character = require('../models/characters/character');

let app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());


let findUserWithEmail = function (email, returnUser) {
    return User.find({email: email}).then(function (user) {
        if (user.length !== 0 && !returnUser){
            return Promise.reject(new Error('User with that email already exist!'));
        }else if(user.length === 1 && returnUser){
            return Promise.resolve(user);
        }
    });
};

let findUserWithUsername = function (username, returnUser) {
    return User.find({username: username}).then(function (user) {
        if (user.length !== 0 && !returnUser){
            return Promise.reject(new Error('User with that username already exist!'));
        }else if(user.length === 1 && returnUser){
            return Promise.resolve(user);
        }
    });
};

function isAuthenticated(req, res, next) {
    if (req.session.user)
        return next();

    res.redirect('/');
}

function compareNames(a,b) {
    if (a.name < b.name)
        return -1;
    if (a.name > b.name)
        return 1;
    return 0;
}


/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});


router.post('/signup', function (req, res, next) {
    /* Check if not empty fileds */
    if (!validator.isEmpty(req.body.username) && !validator.isEmpty(req.body.email) &&
        !validator.isEmpty(req.body.password) && !validator.isEmpty(req.body.password_conf)) {
        /* Check if email and same password */
        if (validator.isEmail(req.body.email) && req.body.password === req.body.password_conf) {

            /* If we don't curretly have user with that email or username we create a new one*/
            Promise.all([findUserWithEmail(req.body.email, false), findUserWithUsername(req.body.username, false)])
            .then(() => bcrypt.hash(req.body.password, 5)).then(function (hash) {
                let user = new User({
                    username: req.body.username,
                    email: req.body.email,
                    password: hash,
                });
                return user.save();
            }).then(function (doc) {
                req.session.user = doc;
                res.redirect('/');
            }).catch(function (err) {
                req.session.registrationError = err.message;
                res.redirect('/signup');
            });

        } else {
            req.session.registrationError = "Wrong email or passwords don't match!";
            res.redirect('/signup');
        }
    } else {
        req.session.registrationError = "Missing data!";
        res.redirect('/signup');
    }

});

router.post('/login', function (req, res, next) {
    if (!validator.isEmpty(req.body.usernameOrEmail) && !validator.isEmpty(req.body.password)) {
        Promise.all([findUserWithEmail(req.body.usernameOrEmail, true), findUserWithUsername(req.body.usernameOrEmail, true)])
       .then(function (doc) {
           if ((doc[0] !== undefined && doc[0].length === 1) || (doc[1] !== undefined && doc[1].length === 1)) {
               doc = doc.filter(val => val !== undefined);
               let foundUser = doc[0][0];

               bcrypt.compare(req.body.password, foundUser.password).then(function (res) {
                   if (res === false){
                       return Promise.reject(new Error('Wrong credentials!'));
                   }
               }).then(function () {
                   req.session.user = foundUser;
                   res.redirect('/');
               }).catch(function (err) {
                   req.session.loginError = err.message;
                   res.redirect('/login')
               });
           }else{
               return Promise.reject(new Error('Wrong credentials!'));
           }
        }).catch(function (err) {
            req.session.loginError = err.message;
            res.redirect('/login');
        });
    } else {
        req.session.loginError = "Missing data!";
        res.redirect('/login');
    }
});

router.get('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) throw err;
        else{
            res.redirect('/');
        }
    })
});

router.get('/myprofile', isAuthenticated, function (req, res, next) {
    res.render('users/myprofile', {user: req.session.user, title: 'Profile'});
});

router.get('/mycharacters', isAuthenticated, function (req, res, next) {
    Character.find({user: req.session.user}).then(function (characters) {
        res.render('users/mycharacters', {user: req.session.user, characters: characters, title: 'Characters'});
    }).catch(function (err) {
        res.render('users/mycharacters', {user: req.session.user, error: 'Problem with retrieving characters.', title: 'Characters'});
    });
});

router.get('/myitems', isAuthenticated, function (req, res, next) {

    Item.find({user: req.session.user}).then(function (items) {
        res.render('users/myitems', {user: req.session.user, items: items, title: 'Items'});
    }).catch(function (err) {
        res.render('users/myitems', {user: req.session.user, error: 'Problem with retrieving items.', title: 'Items'});
    })

});

router.get('/newcharacter', isAuthenticated, function (req, res, next) {
    Promise.all([
        Race.find(),
        Class.find(),
        Skill.find({savingThrow: false}),
        Item.find().sort({name: 1})
    ]).then(function (doc) {
        doc[2].sort(compareNames);
        res.render('users/newcharacter', {races: doc[0], classes: doc[1], skills: doc[2], items: doc[3], user: req.session.user, title: 'Character creation'});
    }).catch(function (err) {

    });

});

router.get('/newitem', isAuthenticated, function (req, res, next) {
    res.render('users/newitem', {user: req.session.user, title: 'Item creation'});

});

router.post('/character', isAuthenticated, function (req, res) {
   // res.send(req.body);

   Promise.all([
       Class.findOne({name: req.body.class}),
       Race.findOne({name: req.body.race}),
       Skill.find({name: req.body.skills}),
       Item.find({_id: req.body.items})
   ]).then(function (doc) {
       if (req.body.characterId){
           Character.findOne({ _id: req.body.characterId}).exec().then(function (character) {
               character.name = req.body.name;
               character.class = doc[0];
               character.race = doc[1];
               character.skills = doc[2];
               character.items = doc[3];
               character.strength = req.body.strength;
               character.dexterity = req.body.dexterity;
               character.constitution = req.body.constitution;
               character.intelligence = req.body.intelligence;
               character.wisdom = req.body.wisdom;
               character.charisma = req.body.charisma;
               character.level = req.body.level;
               character.healthPoints = req.body.hp;
               character.armorClass = req.body.ac;
               character.proficiency = req.body.proficiency;
               character.gold = req.body.gold;
               character.silver = req.body.silver;
               character.copper = req.body.copper;
               character.user = req.session.user;


               character.save().then(function () {
                   res.redirect('/users/mycharacters');
               })
           });

       }
      else {
           var character = new Character();

           character.name = req.body.name;
           character.class = doc[0];
           character.race = doc[1];
           character.skills = doc[2];
           character.strength = req.body.strength;
           character.dexterity = req.body.dexterity;
           character.constitution = req.body.constitution;
           character.intelligence = req.body.intelligence;
           character.wisdom = req.body.wisdom;
           character.charisma = req.body.charisma;
           character.level = req.body.level;
           character.healthPoints = req.body.hp;
           character.armorClass = req.body.ac;
           character.proficiency = req.body.proficiency;
           character.gold = req.body.gold;
           character.silver = req.body.silver;
           character.copper = req.body.copper;
           character.user = req.session.user;

           character.save().then(function () {
               res.redirect('/users/mycharacters');
           })
       }
   });



});

router.post('/item', isAuthenticated, function (req, res) {
    if (!validator.isEmpty(req.body.name) && !validator.isEmpty(req.body.type) &&
        !validator.isEmpty(req.body.description)) {
        if (req.body.itemId){
            Item.findOne({ _id: req.body.itemId}).exec().then(function (item) {
                    item.name = req.body.name;
                    item.type = req.body.type;
                    item.description = req.body.description;
                    item.user = req.session.user;


                item.save().then(function () {
                    res.redirect('/users/myitems');
                })
            }).catch(function (err) {
                console.log(err);
            });

        }
        else {
            let item = new Item({
                name: req.body.name,
                type: req.body.type,
                description: req.body.description,
                user: req.session.user
            });
            item.save().then(function () {
                res.redirect('/users/myitems');
            })
        }

    }else{
        res.redirect('/users/newitem');
    }
});


router.get('/characters/:characterId/edit', isAuthenticated, function (req, res, next) {
    Promise.all([
        Race.find(),
        Class.find(),
        Skill.find({savingThrow: false}),
        Item.find().sort({name: 1}),
        Character.findOne({_id: req.params.characterId}).populate('race', 'name').populate('class', 'name').populate('skills', 'name').exec()
    ]).then(function (doc) {
        // sort skills by name
        doc[2].sort(compareNames);

        let hasSkills =[];

        // get all skills from character
        doc[4].skills.forEach(function (skill) {
            hasSkills.push(skill.name);
        });

        res.render('users/newcharacter', {
            races: doc[0],
            classes: doc[1],
            skills: doc[2],
            items: doc[3],
            user: req.session.user,
            character: doc[4],
            hasSkills: hasSkills,
            title: doc[4].name + ' edit'
        });
    }).catch(function (err) {

    });

});

router.get('/items/:itemId/edit', isAuthenticated, function (req, res, next) {
    Promise.all([
        Item.findOne({_id: req.params.itemId})
    ]).then(function (doc) {
        res.render('users/newitem', {
            item: doc[0],
            title: doc[0].name + ' edit',
            user: req.session.user,
        });
    }).catch(function (err) {

    });

});

router.post('/items/:itemId/vote', isAuthenticated, function (req, res, next) {

    Promise.all([
        Item.findOne({_id: req.params.itemId}),
        Vote.findOne({user: req.session.user._id, item: req.params.itemId})
    ]).then(function (doc) {
            if (!doc[1]) {
                let item = doc[0];
                item.votes = item.votes + 1;

                let vote = new Vote({
                    user: req.session.user._id,
                    item: req.params.itemId
                });

                Promise.all([
                    item.save(),
                    vote.save()
                ]).then(function () {
                    res.json({success: true, item: item});
                }).catch(function (err) {
                    res.status(500);
                    res.json({success: false, errors: 'Problem with saving vote.'});
                });
            }else{
                return Promise.reject(new Error('You have already voted for this item'));
            }

        }).catch(function (err) {
        res.status(400);
        res.json({success: false, errors: err.message});
    });

});

module.exports = router;
