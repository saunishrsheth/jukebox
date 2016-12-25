var express = require('express');
var router = express.Router({mergeParams : true});
var request = require('request');
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var password = 'd6F3Efeq';
var moment = require('moment');
var user = require('../modules/database').user;

function encrypt(text){
    var cipher = crypto.createCipher(algorithm,password);
    var crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text){
    var decipher = crypto.createDecipher(algorithm,password);
    var dec = decipher.update(text,'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
}

/* GET users listing. */
router.get('/', function(req, res, next) {
    var str = req.query.message?req.query.message : "";
    if(req.params.token === 'message') {
        if(!req.user) res.redirect('/?message=User is not logged in');
        else{
            if(!req.user.isVerified) {
                res.render('verify', {title: 'verification page', email : req.user.email, message: str});
            }else res.redirect('/profile/'+req.user.name.firstName+'/');
        }
    }
    else{
        var data = JSON.parse(decrypt(req.params.token));
        user.findOne({email : data.email}, function (err, user) {
            if(err) res.redirect('/signup');
            else{
                if( moment().isBefore(data.dateandtime) ) {
                    user.isVerified = true;
                    user.save(function (err) {
                        if(err) next(err);
                        req.login(user, function(err) {
                            if (err) res.redirect('/verify/'+user.name.firstName+'/message?message='+err);
                            else return res.redirect('/profile/' + user.name.firstName);
                        });
                    });
                }
            }
        });
    }
});


router.post('/', function (req, res, next) {
    if(req.user){
        if(req.body.emailverify === "Send Email verification") {
            var data = {
                email : req.user.email,
                dateandtime : moment().add(24, 'h')
            };
            var str = encrypt(JSON.stringify(data));
            var url = "http://localhost:3000/verify/"+req.user.name.firstName+"/"+str;

            if(req.body.emailverify === 'Send Email verification'){
                var headers = {
                    'Content-Type': 'application/json'
                };
                var dataString = '{"value1":"'+req.user.email+'","value2": "'+req.user.name.firstName+'" , "value3" : "'+url+'"}';
                var options = {
                    url: 'https://maker.ifttt.com/trigger/Email_Verification/with/key/dQ0Tid1VSllOFB0h4ow86TKsUyDwMkJk9RW2UT8nn_M',
                    method: 'POST',
                    headers: headers,
                    body: dataString
                };
                function callback(error, response, body) {
                    if(error) console.log("Error : "+error);
                }
                request(options, callback);
                res.redirect('/verify/'+req.user.name.firstName+'/message?message=Email verification Send');
            }
        }

        else if(req.body.changeemail === "Change Email Address") {
            user.findOne({email : req.user.email}, function (err, result) {
                if(err) res.redirect('/verify/'+req.user.name.firstName+'/message?message=some error');
                else {
                    user.findOne({email : req.body.email}, function (err, check) {
                        if(check) res.redirect('/verify/'+req.user.name.firstName+'/message?message=This email is already in use');
                        else {
                            result.email = req.body.email;
                            result.save(function (err) {
                                if(err) res.redirect('/verify/'+req.user.name.firstName+'/message?message=some error');
                                else res.redirect('/verify/'+req.user.name.firstName+'/message?message=email updated successfully');
                            })
                        }
                    });
                }
            })
        }
    }
    else res.redirect('/?message=User is not logged in');
});

module.exports = router;
