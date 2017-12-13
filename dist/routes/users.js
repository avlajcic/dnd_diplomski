'use strict';

//mongod --port 27017 --dbpath=./data
var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var bcrypt = require('bcrypt');
var validator = require('validator');

//DB
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var dbUrl = 'mongodb://localhost:27017/dnd';
mongoose.connect(dbUrl, { useMongoClient: true });

//Models
var User = require('../models/user');

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/signup', function (req, res, next) {
    /* Check if not empty fileds */
    if (!validator.isEmpty(req.body.username) && !validator.isEmpty(req.body.email) && !validator.isEmpty(req.body.password) && !validator.isEmpty(req.body.password_conf)) {
        /* Check if email and same password */
        if (validator.isEmail(req.body.email) && req.body.password === req.body.password_conf) {
            User.find({ email: req.body.email }).then(function (doc) {
                if (doc.length !== 0) {
                    console.log(doc);
                    return Promise.reject(new Error("User with that email already exist!"));
                }
            }).then(function () {
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
                req.session.error = err.message;
                res.redirect('/signup');
            });
        } else {
            req.session.error = "Wrong email or passwords don't match!";
            res.redirect('/signup');
        }
    } else {
        req.session.error = "Missing data!";
        res.redirect('/signup');
    }
});

router.get('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) throw err;else {
            res.redirect('/');
        }
    });
});

module.exports = router;