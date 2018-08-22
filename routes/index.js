let express = require('express');
let router = express.Router();

let Item = require('../models/item');


/* GET home page. */
router.get('/', function(req, res, next) {
    var start = new Date();
    start.setHours(0,0,0,0);

    var end = new Date();
    end.setHours(23,59,59,999);

    Promise.all([
        Item.find().sort({dateCreated: -1}).limit(5),
        Item.find({dateCreated: {$gte: start, $lt: end}}).sort({votes: -1}).limit(5),
        Item.find().sort({votes: -1}).limit(5),
    ]).then(function (doc) {
        res.render('index', {
            latestItems: doc[0],
            hottestToday: doc[1],
            mostVoted: doc[2],
            title: 'Home',
            user: req.session.user
        });
    }).catch(function (err) {
        res.render('index', { title: 'DnD diplomski', user: req.session.user });
    });
});

router.get('/items/:itemId', function (req, res) {
    Promise.all([
        Item.find().findOne({_id: req.params.itemId}).populate('user', 'username').exec(),
    ]).then(function (doc) {
        console.log(doc);
        res.render('item-view', {
            item: doc[0],
            title: doc[0].name,
            user: req.session.user
        });
    }).catch(function (err) {
        console.log(err);
        res.render('404', {
            title: '404',
        });
    });
});

router.get('/signup', function(req, res, next) {
    res.render('signup', {error: req.session.registrationError, title: 'Signup'});
});

router.get('/login', function(req, res, next) {
    res.render('login', {error: req.session.loginError, title: 'Login'});
});
module.exports = router;
