var user = require('./database').user;
var bcrypt = require('bcrypt-nodejs');
var promise = require('promise');
var shortid = require('shortid');
var playlist = require('./database').playlist;
var like_dislike = require('./database').like_dislike;
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var password = 'd6F3Efeq';
var moment = require('moment');
var request = require('request');

function encrypt(text) {
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}
function decrypt(text) {
    var decipher = crypto.createDecipher(algorithm, password);
    var dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}


var checkAuth = function (email, password) {
    return new promise(function (fulfill, reject) {
        var error = null;
        var result = null;
        var message = null;
        user.findOne({email: email}, function (err, user) {
            if (err) {
                error = "DBConnectError";
                message = "Database Connection Error"
            }
            else if (!user) {
                error = "NoSuchEmail";
                message = "This email is not registered"
            }
            else if (!bcrypt.compareSync(password, user.password)) {
                error = "PasswordMismatch";
                message = "Password entered is not correct"
            }
            else {
                var temp = {
                    uid: user.uid,
                    mobileNo: user.mobileNo,
                    image: user.image,
                    isAdmin: user.isAdmin,
                    email: user.email,
                    isVerified: user.isVerified,
                    name: {
                        firstName: user.name.firstName,
                        lastName: user.name.firstName
                    }
                };
                result = temp;
                message = 'success';
            }
            var data = {
                error: error,
                user: result,
                message: message
            };
            if (data.error) reject(data);
            else fulfill(data);
        });
    });
};
var create = function (req, email, password) {
    var error = null;
    var result = null;
    var message = null;
    var data = null;
    return new promise(function (fulfill, reject) {
        user.findOne({email: email}, function (err, check) {
            if (err) {
                error = "InternalServerError";
                message = "Internal server error";
                data = {
                    error: error,
                    user: result,
                    message: message
                };
                reject(data);
            }
            else if (check) {
                error = "UserExists";
                message = "This email is already in use";
                data = {
                    error: error,
                    user: result,
                    message: message
                };
                reject(data);
            }
            else {
                var addUser = new user({
                    uid: shortid.generate(),
                    name: {
                        firstName: req.body.first_name,
                        lastName: req.body.last_name
                    },
                    gender: req.body.gender,
                    date_of_birth: req.body.DOB,
                    isAdmin: false,
                    email: email,
                    password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
                    isVerified: false
                });
                addUser.save(function (err, user) {
                    if (err) {
                        error = "dataIncorrect";
                        message = "Database is unable to accept this data"
                    } else {
                        result = {
                            uid: user.uid,
                            mobileNo: user.mobileNo,
                            image: user.image,
                            isAdmin: user.isAdmin,
                            email: user.email,
                            isVerified: user.isVerified,
                            name: {
                                firstName: user.name.firstName,
                                lastName: user.name.firstName
                            }
                        };
                        message = "success";
                        data = {
                            error: error,
                            user: result,
                            message: message
                        };
                        fulfill(data);
                    }
                });

            }
        });
    });
};
var link_fb_user = function (local_user, profile) {
    return new promise(function (fulfill, reject) {
        user.findOne({'facebook.fbid': profile.id}, function (err, result) {
            if (err) reject({status: 'IntSer', message: 'Internal Server Error'});
            else if (result != undefined) reject({
                status: 'AldLnk',
                message: 'This account is already linked with Facebook account'
            });
            else {
                user.findOne({uid: local_user.uid}, function (err, data) {
                    data.facebook.fbid = profile.id;
                    data.facebook.name.firstName = profile.name.givenName;
                    data.facebook.name.lastName = profile.name.familyName;
                    data.facebook.gender = profile.gender;
                    data.facebook.fbemail = profile.emails[0].value;
                    data.facebook.image = profile.photos[0].value;
                    data.facebook.music = JSON.stringify(profile._json.music.data);
                    data.save(function (err) {
                        if (err) reject({satus: 'IntSer', message: 'Internal Server Error'});
                        else fulfill({status: 'success', message: 'Facebook Account linked'});
                    })
                })
            }
        });
    })
};
var addSong = function (vid, title, description, image, uid) {
    return new promise(function (fulfill, reject) {
        playlist.find({vid: vid}, function (err, data) {
            if (err) reject({status_code: 'IntSer', message: 'Internal server error'});
            else {
                if (data[0] === undefined) {
                    var song = new playlist({
                        vid: vid,
                        title: title,
                        description: description,
                        image: image,
                        addedby: uid,
                        flag: false,
                        priority: 'HIGH',
                        like_count: 0,
                        dislike_count: 0
                    });
                    song.save(function (err) {
                        if (err) reject({status_code: 'IntSer', message: 'Internal server error'});
                        else fulfill({status_code: 'success', message: 'Song added to the playlist'});
                    })
                }
                else reject({status_code: 'DupSong', message: 'Song is already in the list'})
            }
        });
    });
};
var like = function (vid, uid) {
    return new promise(function (fulfill, reject) {
        like_dislike.find({uid: uid}, function (err, data) {
            if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
            else {
                if (data[0] != undefined) {
                    var bool = true;
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].vid === vid) {
                            bool = false;
                            if (data[i].like) reject({status_code: 'AlrTru', message: "Song is already liked"});
                            else {
                                data[i].like = true;
                                data[i].dislike = false;
                                data[i].save(function (err) {
                                    if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                                    else {
                                        playlist.findOne({vid: vid}, function (err, song) {
                                            if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                                            else {
                                                song.like_count = song.like_count + 1;
                                                song.dislike_count = song.dislike_count - 1;
                                                song.save(function (err) {
                                                    if (err) reject({
                                                        status_code: 'IntSer',
                                                        message: 'Internal Server Error'
                                                    });
                                                })
                                            }
                                        });
                                        fulfill({status_code: 'success', message: 'song liked'});
                                    }
                                })
                            }
                        }
                    }
                    if (bool) createLike();
                } else createLike();
            }
            function createLike() {
                var like = new like_dislike({
                    uid: uid,
                    vid: vid,
                    like: true,
                    dislike: false
                });
                like.save(function (err) {
                    if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                    else {
                        playlist.findOne({vid: vid}, function (err, song) {
                            if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                            else {
                                song.like_count = song.like_count + 1;
                                song.save(function (err) {
                                    if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                                })
                            }
                        });
                        fulfill({status_code: 'success', message: 'song liked'});
                    }
                });
            }
        })
    })
};
var dislike = function (vid, uid) {
    return new promise(function (fulfill, reject) {
        like_dislike.find({uid: uid}, function (err, data) {
            if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
            else {
                if (data[0] != undefined) {
                    var bool = true;
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].vid === vid) {
                            bool = false;
                            if (data[i].dislike) reject({status_code: 'AlrTru', message: "Song is already disliked"});
                            else {
                                data[i].like = false;
                                data[i].dislike = true;
                                data[i].save(function (err) {
                                    if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                                    else {
                                        playlist.findOne({vid: vid}, function (err, song) {
                                            if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                                            else {
                                                song.like_count = song.like_count - 1;
                                                song.dislike_count = song.dislike_count + 1;
                                                song.save(function (err) {
                                                    if (err) reject({
                                                        status_code: 'IntSer',
                                                        message: 'Internal Server Error'
                                                    });
                                                })
                                            }
                                        });
                                        fulfill({status_code: 'success', message: 'song disliked'});
                                    }
                                })
                            }
                        }
                    }
                    if (bool) createLike();
                } else createLike();
            }
            function createLike() {
                var dislike = new like_dislike({
                    uid: uid,
                    vid: vid,
                    like: false,
                    dislike: true
                });
                dislike.save(function (err) {
                    if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                    else {
                        playlist.findOne({vid: vid}, function (err, song) {
                            if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                            else {
                                song.dislike_count = song.dislike_count + 1;
                                song.save(function (err) {
                                    if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                                })
                            }
                        });
                        fulfill({status_code: 'success', message: 'song disliked'});
                    }
                });
            }
        })
    })
};
var viewPlaylist = function (uid) {
    return new promise(function (fulfill, reject) {
        playlist.find({}, function (err, list) {
            if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
            else {
                like_dislike.find({uid: uid}, function (err, ldlist) {
                    if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                    else fulfill({playlist: list, likes_dislikes: ldlist});
                })
            }
        })
    })
};
var verifyUser = function (token) {
    return new promise(function (fulfill, reject) {
        try {
            var data = JSON.parse(decrypt(token));
            user.findOne({email: data.email}, function (err, user) {
                if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                else {
                    if (moment().isBefore(data.dateandtime)) {
                        user.isVerified = true;
                        user.save(function (err) {
                            if (err) reject({status_code: 'IntSer', message: 'Internal Server Error'});
                            else fulfill({status_code: 'success', message: data.email + ' is verified', user: user});
                        });
                    }
                    else reject({status_code: 'TokExp', message: 'This Token is expired Please Re-generate'});
                }
            });
        } catch (err) {
            reject({status_code: 'InvUrl', message: 'Invalid Verification URL'});
        }
    });
};
var sendVerification = function (user) {
    return new promise(function (fulfill, reject) {
        var data = {
            email: user.email,
            dateandtime: moment().add(24, 'h')
        };
        var str = encrypt(JSON.stringify(data));
        var url = "http://localhost:3000/verify/" + user.name.firstName + "/" + str;
        var headers = {
            'Content-Type': 'application/json'
        };
        var dataString = '{"value1":"' + user.email + '","value2": "' + user.name.firstName + '" , "value3" : "' + url + '"}';
        var options = {
            url: 'https://maker.ifttt.com/trigger/Email_Verification/with/key/dQ0Tid1VSllOFB0h4ow86TKsUyDwMkJk9RW2UT8nn_M',
            method: 'POST',
            headers: headers,
            body: dataString
        };

        function callback(error, response, body) {
            if (error) reject({status_code: 'IntSer', message: 'Internal Server Error'});
            else fulfill({status_code: 'success', message: 'Email Verification Sent'});
        }

        request(options, callback);
    });
};

module.exports = {
    checkAuth: checkAuth,
    create: create,
    addsong: addSong,
    like: like,
    dislike: dislike,
    viewPlaylist: viewPlaylist,
    verifyUser: verifyUser,
    sendVerificaion: sendVerification,
    link_fb_user: link_fb_user
};
