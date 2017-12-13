'use strict';

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express', user: req.session.user });
});

router.get('/signup', function (req, res, next) {
  res.render('signup', { error: req.session.error });
});
module.exports = router;