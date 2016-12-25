var passport = require('passport');
var LocalStratgy = require('passport-local').Strategy;
var user = require('./database').user;
var dbOperation = require('./dbOperation');

//session management
passport.serializeUser(function(user, done) {
    done(null, user.uid);
});
passport.deserializeUser(function(id, done) {
    user.findOne({uid : id }, function(err, user) {
        done(err, user);
    });
});

//local authentication strategy
var signUp = new LocalStratgy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
}, function (req, email, password, done) {
    dbOperation.create(req, email, password).then(function (value) {
        console.log(value.user);
        return done(null, value.user, {message : value.message});
    }, function (error) {
        return done(null, false, {message : error.message});
    });
});
var login = new LocalStratgy({
    usernameField : 'email',
    passwordField : 'password'
}, function (email, password, done) {
    dbOperation.checkAuth(email, password).then(function (value) {
        return done(null, value.user);
    }, function (error) {
        return done(null, false, {message : error.message});
    });
});

//passport middleware
passport.use('local-signup', signUp);
passport.use('local-login', login);

//module passport export for app.js
module.exports = passport;