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
    res.render('users/myprofile', {user: req.session.user});
});

router.get('/mycharacters', isAuthenticated, function (req, res, next) {
    Character.find({user: req.session.user}).then(function (characters) {
        res.render('users/mycharacters', {user: req.session.user, characters: characters});
    }).catch(function (err) {
        res.render('users/mycharacters', {user: req.session.user, error: 'Problem with retrieving characters.'});
    });
});

router.get('/myitems', isAuthenticated, function (req, res, next) {

    Item.find({user: req.session.user}).then(function (items) {
        res.render('users/myitems', {user: req.session.user, items: items});
    }).catch(function (err) {
        res.render('users/myitems', {user: req.session.user, error: 'Problem with retrieving items.'});
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
        res.render('users/newcharacter', {races: doc[0], classes: doc[1], skills: doc[2], items: doc[3], user: req.session.user});
    }).catch(function (err) {

    });

});

router.get('/newitem', isAuthenticated, function (req, res, next) {
    res.render('users/newitem', {user: req.session.user});

});

router.post('/character', isAuthenticated, function (req, res) {
   // res.send(req.body);

   Promise.all([
       Class.findOne({name: req.body.class}),
       Race.findOne({name: req.body.race}),
       Skill.find({name: req.body.skills})
   ]).then(function (doc) {

       let character = new Character({
           name: req.body.name,
           class: doc[0],
           race: doc[1],
           skills: doc[2],
           strength: req.body.strength,
           dexterity: req.body.dexterity,
           constitution: req.body.constitution,
           intelligence: req.body.intelligence,
           wisdom: req.body.wisdom,
           charisma: req.body.charisma,
           level: req.body.level,
           healthPoints: req.body.hp,
           armorClass: req.body.ac,
           proficiency: req.body.proficiency,
           gold: req.body.gold,
           silver: req.body.silver,
           copper: req.body.copper,
           user: req.session.user
       });
       character.save().then(function () {
           res.redirect('/users/mycharacters');
       })
   });



});

router.post('/item', isAuthenticated, function (req, res) {
    if (!validator.isEmpty(req.body.name) && !validator.isEmpty(req.body.type) &&
        !validator.isEmpty(req.body.description)) {
        let item = new Item({
            name: req.body.name,
            type: req.body.type,
            description: req.body.description,
            user: req.session.user
        });
        item.save().then(function () {
            res.redirect('/users/myitems');
        })
    }else{

    }
});


module.exports = router;
