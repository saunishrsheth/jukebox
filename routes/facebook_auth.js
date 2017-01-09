var express = require('express');
var passport = require('../modules/auth');
var router = express.Router();

/* GET home page. */
router.get('/', passport.authorize('facebook_link', { authType: 'rerequest', scope: ['email', 'user_actions.music'] }));


module.exports = router;
