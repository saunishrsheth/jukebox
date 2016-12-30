var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('./modules/auth');
var session = require('express-session');
var io = require('socket.io')();

var index = require('./routes/index');
var verify = require('./routes/verifiy');
var signup = require('./routes/signup');
var profile = require('./routes/profile')(io);
var logout = require('./routes/logout');
var player = require('./routes/player')(io);
var google_auth = require('./routes/google_auth');
var google_auth_callback = require('./routes/google_auth_callback');
var facebook_auth_callback = require('./routes/google_auth_callback');

var app = express();
app.io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'jukeBox',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/verify/:username/:token', verify);
app.use('/signup', signup);
app.use('/profile/:username', profile);
app.use('/logout', logout);
app.use('/player', player);
app.use('/auth/google', google_auth);
app.use('/auth/google/callback', google_auth_callback);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
