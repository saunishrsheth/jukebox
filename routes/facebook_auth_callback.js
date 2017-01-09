var express = require('express');
var passport = require('../modules/auth');
var router = express.Router();

/* GET home page. */
router.get('/',
    passport.authorize('facebook_link', { successRedirect: '/',
        failureRedirect: '/login' }));

module.exports = router;
