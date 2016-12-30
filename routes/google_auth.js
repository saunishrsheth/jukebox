var express = require('express');
var passport = require('../modules/auth');
var router = express.Router();

/* GET home page. */
router.get('/',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login','https://www.googleapis.com/auth/userinfo.email'] }));


module.exports = router;
