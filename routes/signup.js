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
            req.login(user, function(err) {
                if (err) { return next(err); }
                else return res.redirect('/verify/' + user.name.firstName +'/message');
            });
        }
    })(req, res, next);
});

module.exports = router;
