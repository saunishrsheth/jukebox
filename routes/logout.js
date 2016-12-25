var express = require('express');
var router = express.Router({mergeParams : true});

/* GET users listing. */
router.get('/', function(req, res, next) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
