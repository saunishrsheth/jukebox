var express = require('express');
var router = express.Router();
var passport = require('../modules/auth');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('signup', { title: 'Register', message: " "});
});

router.post('/', function (req, res, next) {
    passport.authenticate('local-signup', function(err, user, info) {
        if (user === false) {
            res.render('signup', { title : 'Register', message : info.message});
        } else {
            res.redirect('/?message=Signup Successfull please login');
        }
    })(req, res, next);
});

module.exports = router;
