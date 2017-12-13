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
            /* CHECK PASSWORD */
       .then(function (doc) {
           if ((doc[0] !== undefined && doc[0].length === 1) || (doc[1] !== undefined && doc[1].length === 1)) {
               req.session.user = doc;
               res.redirect('/');
           }else{
               return Promise.reject(new Error('Problem with retrieving user!'));
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


module.exports = router;
