var user = require('./database').user;
var bcrypt = require('bcrypt-nodejs');
var promise = require('promise');
var shortid = require('shortid');

var checkAuth = function (email, password) {
    return new promise(function (fulfill, reject) {
        var error = null;
        var result = null;
        var message = null;
        user.findOne({email : email}, function (err, user) {
            if (err) { error = "DBConnectError"; message = "Database Connection Error"}
            else if (!user) { error = "NoSuchEmail"; message = "This email is not registered"}
            else if (!bcrypt.compareSync(password, user.password)) { error = "PasswordMismatch"; message = "Password entered is not correct"}
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
                error : error,
                user : result,
                message : message
            };
            if(data.error) reject(data);
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
        user.findOne({email : email}, function (err, check) {
            if(err) {
                error = "InternalServerError";
                message = "Internal server error";
                data = {
                    error: error,
                    user : result,
                    message: message
                };
                reject(data);
            }
            else if(check) {
                error = "UserExists";
                message = "This email is already in use";
                data = {
                    error: error,
                    user : result,
                    message: message
                };
                reject(data);
            }
            else {
                user.findOne({mobileNo : req.body.mobileNo}, function (err, check) {
                    if(check) {
                        error = "MobileNoExists";
                        message = 'This mobile no is already registered';
                        data = {
                            error: error,
                            user : result,
                            message: message
                        };
                        reject(data);
                    }
                    else {
                        var addUser = new user({
                            uid : shortid.generate(),
                            name : {
                                firstName : req.body.first_name,
                                lastName : req.body.last_name
                            },
                            mobileNo : req.body.mobileNo,
                            image : null,
                            isAdmin : false,
                            email : email,
                            password : bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
                            isVerified : false
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
                                    error : error,
                                    user : result,
                                    message : message
                                };
                                fulfill(data);
                            }
                        });
                    }
                });
            }
        });
    });
};

module.exports = {
    checkAuth : checkAuth,
    create : create
};