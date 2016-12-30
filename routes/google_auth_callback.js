var express = require('express');
var passport = require('../modules/auth');
var router = express.Router();

/* GET home page. */
router.get('/',
    passport.authenticate('google', {failureRedirect: '/'}),
    function (req, res) {
        console.log(req);
        res.redirect('/');
    });

module.exports = router;
