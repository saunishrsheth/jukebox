var express = require('express');
var passport = require('../modules/auth');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var str = req.query.message? req.query.message : "";
  res.render('index', { title: 'Login' , message: str});
});

router.post('/', function (req, res, next) {
    passport.authenticate('local-login', function(err, user, info) {
        if (user === false) {
            res.render('index', { title : 'Login', message : info.message});
        } else {
            req.login(user, function(err) {
                if (err) { return next(err); }
                else return res.redirect('/verify/'+user.name.firstName+'/message');
            });
        }
    })(req, res, next);
});

module.exports = router;
