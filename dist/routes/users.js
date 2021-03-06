'use strict';

var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var bcrypt = require('bcrypt');
var validator = require('validator');

//DB
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var dbUrl = process.env.DB_URL;
mongoose.connect(dbUrl, { useMongoClient: true });

//Models
var User = require('../models/user');
var Race = require('../models/characters/race');
var Class = require('../models/characters/class');
var Skill = require('../models/characters/skill');
var Item = require('../models/item');
var Vote = require('../models/votes');
var Comment = require('../models/comments');
var Group = require('../models/group');
var Invite = require('../models/invite');
var Character = require('../models/characters/character');

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

var findUserWithEmail = function findUserWithEmail(email, returnUser) {
    return User.find({ email: email }).then(function (user) {
        if (user.length !== 0 && !returnUser) {
            return Promise.reject(new Error('User with that email already exist!'));
        } else if (user.length === 1 && returnUser) {
            return Promise.resolve(user);
        }
    });
};

var findUserWithUsername = function findUserWithUsername(username, returnUser) {
    return User.find({ username: username }).then(function (user) {
        if (user.length !== 0 && !returnUser) {
            return Promise.reject(new Error('User with that username already exist!'));
        } else if (user.length === 1 && returnUser) {
            return Promise.resolve(user);
        }
    });
};

function isAuthenticated(req, res, next) {
    if (req.session.user) return next();

    res.redirect('/');
}

function compareNames(a, b) {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
}

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/signup', function (req, res, next) {
    /* Check if not empty fileds */
    if (!validator.isEmpty(req.body.username) && !validator.isEmpty(req.body.email) && !validator.isEmpty(req.body.password) && !validator.isEmpty(req.body.password_conf)) {
        /* Check if email and same password */
        if (validator.isEmail(req.body.email) && req.body.password === req.body.password_conf) {

            /* If we don't curretly have user with that email or username we create a new one*/
            Promise.all([findUserWithEmail(req.body.email, false), findUserWithUsername(req.body.username, false)]).then(function () {
                return bcrypt.hash(req.body.password, 5);
            }).then(function (hash) {
                var user = new User({
                    username: req.body.username,
                    email: req.body.email,
                    password: hash
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
        Promise.all([findUserWithEmail(req.body.usernameOrEmail, true), findUserWithUsername(req.body.usernameOrEmail, true)]).then(function (doc) {
            if (doc[0] !== undefined && doc[0].length === 1 || doc[1] !== undefined && doc[1].length === 1) {
                doc = doc.filter(function (val) {
                    return val !== undefined;
                });
                var foundUser = doc[0][0];

                bcrypt.compare(req.body.password, foundUser.password).then(function (res) {
                    if (res === false) {
                        return Promise.reject(new Error('Wrong credentials!'));
                    }
                }).then(function () {
                    req.session.user = foundUser;
                    res.redirect('/');
                }).catch(function (err) {
                    req.session.loginError = err.message;
                    res.redirect('/login');
                });
            } else {
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
        if (err) throw err;else {
            res.redirect('/');
        }
    });
});

// router.get('/myprofile', isAuthenticated, function (req, res, next) {
//     res.render('users/myprofile', {user: req.session.user, title: 'Profile'});
// });

router.get('/mycharacters', isAuthenticated, function (req, res, next) {
    Character.find({ user: req.session.user }).populate('class', 'name').populate('race', 'name').exec().then(function (characters) {
        res.render('users/mycharacters', { user: req.session.user, characters: characters, title: 'Characters' });
    }).catch(function (err) {
        res.render('users/mycharacters', { user: req.session.user, error: 'Problem with retrieving characters.', title: 'Characters' });
    });
});

router.get('/myitems', isAuthenticated, function (req, res, next) {

    Item.find({ user: req.session.user }).then(function (items) {
        res.render('users/myitems', { user: req.session.user, items: items, title: 'Items' });
    }).catch(function (err) {
        res.render('users/myitems', { user: req.session.user, error: 'Problem with retrieving items.', title: 'Items' });
    });
});

router.get('/newcharacter', isAuthenticated, function (req, res, next) {
    Promise.all([Race.find(), Class.find(), Skill.find({ savingThrow: false }), Item.find().sort({ name: 1 })]).then(function (doc) {
        doc[2].sort(compareNames);
        res.render('users/newcharacter', { races: doc[0], classes: doc[1], skills: doc[2], items: doc[3], user: req.session.user, title: 'Character creation' });
    }).catch(function (err) {});
});

router.get('/newitem', isAuthenticated, function (req, res, next) {
    res.render('users/newitem', { user: req.session.user, title: 'Item creation' });
});

router.post('/character', isAuthenticated, function (req, res) {
    // res.send(req.body);

    Promise.all([Class.findOne({ name: req.body.class }), Race.findOne({ name: req.body.race }), Skill.find({ name: req.body.skills }), Item.find({ _id: req.body.items })]).then(function (doc) {
        if (req.body.characterId) {
            Character.findOne({ _id: req.body.characterId }).exec().then(function (character) {
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
                });
            });
        } else {
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
            });
        }
    });
});

router.post('/item', isAuthenticated, function (req, res) {
    if (!validator.isEmpty(req.body.name) && !validator.isEmpty(req.body.type) && !validator.isEmpty(req.body.description)) {
        if (req.body.itemId) {
            Item.findOne({ _id: req.body.itemId }).exec().then(function (item) {
                item.name = req.body.name;
                item.type = req.body.type;
                item.description = req.body.description;
                item.user = req.session.user;

                item.save().then(function () {
                    res.redirect('/users/myitems');
                });
            }).catch(function (err) {
                console.log(err);
            });
        } else {
            var item = new Item({
                name: req.body.name,
                type: req.body.type,
                description: req.body.description,
                user: req.session.user
            });
            item.save().then(function () {
                res.redirect('/users/myitems');
            });
        }
    } else {
        res.redirect('/users/newitem');
    }
});

router.get('/characters/:characterId/edit', isAuthenticated, function (req, res, next) {
    Promise.all([Race.find(), Class.find(), Skill.find({ savingThrow: false }), Item.find().sort({ name: 1 }), Character.findOne({ _id: req.params.characterId }).populate('race', 'name').populate('class', 'name').populate('skills', 'name').exec()]).then(function (doc) {
        // sort skills by name
        doc[2].sort(compareNames);

        var hasSkills = [];

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
    }).catch(function (err) {});
});

router.get('/characters/:characterId/delete', isAuthenticated, function (req, res, next) {
    Character.findOne({ _id: req.params.characterId }).then(function (character) {
        if (character.user == req.session.user._id) {
            character.remove().then(function () {
                res.redirect('/users/mycharacters');
            });
        } else {
            Promise.reject(new Error('You are not owner of this character'));
        }
    }).catch(function (err) {
        console.log(err.message);
    });
});

router.get('/items/:itemId/edit', isAuthenticated, function (req, res, next) {
    Promise.all([Item.findOne({ _id: req.params.itemId })]).then(function (doc) {
        res.render('users/newitem', {
            item: doc[0],
            title: doc[0].name + ' edit',
            user: req.session.user
        });
    }).catch(function (err) {});
});

router.get('/items/:itemId/delete', isAuthenticated, function (req, res, next) {
    Item.findOne({ _id: req.params.itemId }).then(function (item) {
        if (item.user == req.session.user._id) {
            item.remove().then(function () {
                res.redirect('/users/myitems');
            });
        } else {
            Promise.reject(new Error('You are not owner of this item'));
        }
    }).catch(function (err) {
        console.log(err.message);
    });
});
router.get('/mygroups', isAuthenticated, function (req, res, next) {

    Promise.all([Group.find({ users: req.session.user }), Group.find({ owner: req.session.user })]).then(function (doc) {
        res.render('users/mygroups', { user: req.session.user, allGroups: doc[0], ownerGroups: doc[1], title: 'Groups' });
    }).catch(function (err) {
        res.render('users/mygroups', { user: req.session.user, error: 'Problem with retrieving groups.', title: 'Groups' });
    });
});

router.get('/newgroup', isAuthenticated, function (req, res, next) {
    User.findOne({ _id: req.session.user._id }).populate('friends').exec().then(function (user) {
        res.render('users/newgroup', { user: req.session.user, title: 'Group creation', friends: user.friends });
    });
});

router.post('/group', isAuthenticated, function (req, res) {
    if (!validator.isEmpty(req.body.name)) {
        if (req.body.groupId) {
            Group.findOne({ _id: req.body.groupId }).exec().then(function (group) {
                group.name = req.body.name;
                group.users = req.body.friends;
                group.users.push(req.session.user);
                group.owner = req.session.user;
                group.dm = req.session.user;

                group.save().then(function () {
                    res.redirect('/users/mygroups');
                });
            }).catch(function (err) {
                console.log(err);
            });
        } else {
            var group = new Group({
                name: req.body.name,
                users: req.body.friends,
                owner: req.session.user,
                dm: req.session.user
            });
            group.users.push(req.session.user);

            group.save().then(function () {
                res.redirect('/users/mygroups');
            });
        }
    } else {
        res.redirect('/users/newgroup');
    }
});

router.get('/groups/:groupId/edit', isAuthenticated, function (req, res, next) {
    Promise.all([Group.findOne({ _id: req.params.groupId }).populate('users').exec(), User.findOne({ _id: req.session.user._id }).populate('friends').exec()]).then(function (doc) {
        res.render('users/newgroup', {
            group: doc[0],
            title: doc[0].name + ' edit',
            user: req.session.user,
            friends: doc[1].friends
        });
    }).catch(function (err) {});
});

router.get('/groups/:groupId/leave', isAuthenticated, function (req, res, next) {
    Group.findOne({ _id: req.params.groupId }).populate('users').exec().then(function (group) {
        var otherUser;
        for (var i = 0; i < group.users.length; i++) {
            if (group.users[i]._id !== req.session.user._id) {
                otherUser = group.users[i];
            }
        }

        if (otherUser) {
            if (group.dm == req.session.user._id) {
                group.dm = otherUser;
            }
            if (group.owner == req.session.user._id) {
                group.owner = otherUser;
            }

            group.users.pull(req.session.user);
            group.save().then(function () {
                res.redirect('/users/mygroups');
            });
        } else {
            group.remove().then(function () {
                res.redirect('/users/mygroups');
            });
        }
    }).catch(function (err) {});
});

router.get('/groups/:groupId/kick/:userId', isAuthenticated, function (req, res, next) {
    Promise.all([Group.findOne({ _id: req.params.groupId }).populate('owner').populate('users').exec(), User.findOne({ _id: req.params.userId })]).then(function (doc) {
        var group = doc[0];
        var user = doc[1];

        if (req.session.user._id == group.owner._id) {
            group.users.pull(user);
            group.save().then(function () {
                res.redirect('/users/groups/' + group._id);
            });
        } else {
            res.redirect('/users/groups/' + group._id);
        }
    }).catch(function (err) {});
});

router.get('/groups/:groupId/delete', isAuthenticated, function (req, res, next) {
    Group.findOne({ _id: req.params.groupId }).then(function (group) {
        group.remove().then(function () {
            res.redirect('/users/mygroups');
        });
    }).catch(function (err) {});
});

router.get('/groups/:groupId', isAuthenticated, function (req, res, next) {
    Promise.all([Group.findOne({ _id: req.params.groupId }).populate('users').populate('dm').populate({
        path: 'characters',
        populate: { path: 'items' }
    }).exec(), Character.find({ user: req.session.user })]).then(function (doc) {
        var character = void 0;
        var group = doc[0];

        for (var i = 0; i < group.characters.length; i++) {
            if (group.characters[i] && group.characters[i].user == req.session.user._id) {
                character = group.characters[i];
                break;
            }
        }

        res.render('users/group', {
            group: doc[0],
            title: doc[0].name,
            characters: doc[1],
            character: character,
            user: req.session.user
        });
    }).catch(function (err) {});
});

router.post('/groups/:groupId/change-character', isAuthenticated, function (req, res, next) {
    Promise.all([Group.findOne({ _id: req.params.groupId }).populate('characters').exec(), Character.findOne({ _id: req.body.character })]).then(function (doc) {
        var group = doc[0];

        for (var i = 0; i < group.characters.length; i++) {
            if (group.characters[i] && group.characters[i].user._id === req.session.user._id) {
                group.characters.pull(group.characters[i]);
            }
        }

        group.characters.push(doc[1]);
        group.save().then(function () {
            res.redirect('/users/groups/' + req.params.groupId);
        });
    }).catch(function (err) {});
});

router.post('/groups/:groupId/trade', isAuthenticated, function (req, res, next) {
    Promise.all([Group.findOne({ _id: req.params.groupId }).populate({
        path: 'characters',
        populate: { path: 'user' }
    }).exec(), User.findOne({ _id: req.body.user }), Item.find({ _id: req.body.items })]).then(function (doc) {
        var group = doc[0];
        var tradingUser = doc[1];
        var items = doc[2];
        var userCharacter = void 0;
        var tradingCharacter = void 0;

        for (var i = 0; i < group.characters.length; i++) {
            if (group.characters[i]) {
                if (group.characters[i].user.username == req.session.user.username) {
                    userCharacter = group.characters[i];
                } else if (group.characters[i].user.username == tradingUser.username) {
                    tradingCharacter = group.characters[i];
                }
            }
        }

        userCharacter.gold -= req.body.gold;
        userCharacter.silver -= req.body.silver;
        userCharacter.copper -= req.body.copper;
        tradingCharacter.gold += req.body.gold;
        tradingCharacter.silver += req.body.silver;
        tradingCharacter.copper += req.body.copper;

        for (var _i = 0; _i < items.length; _i++) {
            userCharacter.items.pull(items[_i]);
            tradingCharacter.items.push(items[_i]);
        }
        Promise.all([userCharacter.save(), tradingCharacter.save()]).then(function () {
            res.redirect('/users/groups/' + req.params.groupId);
        });
    }).catch(function (err) {});
});

router.get('/myfriends', isAuthenticated, function (req, res, next) {
    Promise.all([Invite.find({ to: req.session.user }).populate('from', 'username').exec(), User.findOne({ _id: req.session.user._id }).populate('friends', 'username').exec()]).then(function (doc) {
        res.render('users/myfriends', { user: req.session.user, title: 'Friends', invites: doc[0], friends: doc[1].friends });
    }).catch(function (err) {
        res.render('users/myfriends', { user: req.session.user, title: 'Friends', error: 'Problem with retrieving invites.' });
    });
});

router.get('/friends/:friendId/remove', isAuthenticated, function (req, res, next) {
    Promise.all([User.findOne({ _id: req.session.user._id }), User.findOne({ _id: req.params.friendId })]).then(function (doc) {
        doc[0].friends.pull(doc[1]);
        doc[1].friends.pull(doc[0]);

        Promise.all([doc[0].save(), doc[1].save()]).then(function () {
            res.redirect('/users/myfriends');
        });
    }).catch(function (err) {});
});

/** API **/

router.post('/items/:itemId/vote', isAuthenticated, function (req, res, next) {

    Promise.all([Item.findOne({ _id: req.params.itemId }), Vote.findOne({ user: req.session.user._id, item: req.params.itemId })]).then(function (doc) {
        if (!doc[1]) {
            var item = doc[0];
            item.votes = item.votes + 1;

            var vote = new Vote({
                user: req.session.user._id,
                item: req.params.itemId
            });

            Promise.all([item.save(), vote.save()]).then(function () {
                res.json({ success: true, item: item });
            }).catch(function (err) {
                res.status(500);
                res.json({ success: false, errors: 'Problem with saving vote.' });
            });
        } else {
            return Promise.reject(new Error('You have already voted for this item.'));
        }
    }).catch(function (err) {
        res.status(400);
        res.json({ success: false, errors: err.message });
    });
});

router.post('/items/:itemId/comment', isAuthenticated, function (req, res, next) {

    Item.findOne({ _id: req.params.itemId }).then(function (item) {
        var comment = new Comment({
            item: item._id,
            user: req.session.user._id,
            comment: req.body.comment
        });

        comment.save(function () {
            res.json({ success: true, comment: comment });
        }).catch(function () {
            return Promise.reject(new Error('Problem with saving comment.'));
        });
    }).catch(function (err) {
        res.status(400);
        res.json({ success: false, errors: err.message });
    });
});

router.post('/addfriend', isAuthenticated, function (req, res, next) {

    User.findOne({ username: req.body.friend }).then(function (user) {
        if (!user) {
            return Promise.reject(new Error('There is no user with that username.'));
        }
        var invite = new Invite({
            from: req.session.user._id,
            to: user._id
        });

        invite.save(function () {
            res.json({ success: true, invite: invite });
        }).catch(function () {
            return Promise.reject(new Error('Problem with sending invite.'));
        });
    }).catch(function (err) {
        res.status(400);
        res.json({ success: false, errors: err.message });
    });
});

router.post('/invite/:inviteId/accept', isAuthenticated, function (req, res, next) {
    Invite.findOne({ _id: req.params.inviteId }).populate('from').populate('to').exec().then(function (invite) {
        console.log(invite);
        var userOne = invite.from;
        var userTwo = invite.to;
        userOne.friends.push(userTwo);
        userTwo.friends.push(userOne);

        Promise.all([userOne.save(), userTwo.save(), invite.remove()]).then(function () {
            res.json({ success: true });
        }).catch(function (err) {
            res.status(500);
            res.json({ success: false, errors: 'Problem with adding friends.' });
        });
    }).catch(function (err) {
        res.status(400);
        res.json({ success: false, errors: err.message });
    });
});

router.post('/invite/:inviteId/remove', isAuthenticated, function (req, res, next) {
    Invite.findOne({ _id: req.params.inviteId }).then(function (invite) {

        invite.remove().then(function () {
            res.json({ success: true });
        }).catch(function (err) {
            res.status(500);
            res.json({ success: false, errors: 'Problem with adding friends.' });
        });
    }).catch(function (err) {
        res.status(400);
        res.json({ success: false, errors: err.message });
    });
});

module.exports = router;