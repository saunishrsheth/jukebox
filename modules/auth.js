var passport = require('passport');
var LocalStratgy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
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
var facebook_link = (new FacebookStrategy({
        clientID: "1427571047268002",
        clientSecret: "fc149b38e028280a21d7d3ffdefba26a",
        callbackURL: "http://localhost:3000/auth/facebook/callback",
        profileFields: ['email', 'music', 'picture', 'name', 'gender'],
        passReqToCallback : true
    },
    function(req, accessToken, refreshToken, profile, done) {
        dbOperation.link_fb_user(req.user, profile).then(function (value) {
            console.log(value);
        }, function (error) {
            console.log(error);
        });
    }
));

passport.use(new GoogleStrategy({
        clientID: '646021591909-bnkbrifbjr0rmfhog2aaav3hjunnqj8t.apps.googleusercontent.com',
        clientSecret: 'F8kRVYX4Omh4ECmpp0mBgU8A',
        callbackURL: "http://localhost:3000/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        console.log(profile);
    }
));



//passport middleware
passport.use('local-signup', signUp);
passport.use('local-login', login);
passport.use('facebook_link', facebook_link);

//module passport export for app.js
module.exports = passport;