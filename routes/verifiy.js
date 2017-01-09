var express = require('express');
var router = express.Router({mergeParams: true});
var user = require('../modules/database').user;
var verifyUser = require('../modules/dbOperation').verifyUser;
var sendVerification = require('../modules/dbOperation').sendVerificaion;

router.use('/', function (req, res, next) {

    if (req.user) {
        if (req.user.isVerified) res.redirect('/profile/' + req.user.name.firstName + '/');
        else next();
    }
    else {
        verifyUser(req.params.token).then(function (value) {
            res.redirect('/?message=' + value.message);
        }, function (value) {
            res.redirect('/?message=' + value.message);
        });
    }
});


/* GET users listing. */
router.get('/', function (req, res, next) {
    var str = (!req.query.message) ? "" : req.query.message;
    res.render('verify', {title: 'verification page', email: req.user.email, message: str});
});

router.post('/', function (req, res, next) {

    if (req.body.emailverify === "Send Email verification") {
        sendVerification(req.user).then(function (value) {
            req.logout();
            res.redirect('/?message=' + value.message);
        }, function (error) {
            res.redirect('/verify/' + req.user.name.firstName + '/message?message=' + value.message);
        });
    }

    else if (req.body.changeemail === "Change Email Address") {
        user.findOne({email: req.user.email}, function (err, result) {
            if (err) res.redirect('/verify/' + req.user.name.firstName + '/message?message=some error');
            else {
                user.findOne({email: req.body.email}, function (err, check) {
                    if (check) res.redirect('/verify/' + req.user.name.firstName + '/message?message=This email is already in use');
                    else {
                        result.email = req.body.email;
                        result.save(function (err) {
                            if (err) res.redirect('/verify/' + req.user.name.firstName + '/message?message=some error');
                            else res.redirect('/verify/' + req.user.name.firstName + '/message?message=email updated successfully');
                        })
                    }
                });
            }
        })
    }

});

module.exports = router;
