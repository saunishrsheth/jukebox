var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');
mongoose.Promise = global.Promise;

var schema = mongoose.Schema;

var userSchema = new schema({
    uid : {type : String, unique : true },
    name : {
        firstName : { type :String, require : true},
        lastName : {type : String}
    },
    image : {type : Buffer},
    mobileNo : {type : Number, require : true, unique : true},
    email : {type : String, require : true, unique : true},
    password : {type : String, require : true},
    isAdmin : {type : Boolean},
    isVerified : {type : Boolean},
    emailToken : {type : String}
});

var playlistSchema = new schema({
    vid : { type : String, unique : true},
    title : {type : String},
    description : {type : String},
    image : {type : String},
    addedby : {type : String},
    flag : {type : Boolean},
    priority : {type : String}
});

var user = mongoose.model('users', userSchema);
var playlist = mongoose.model('playlist', playlistSchema);

module.exports = {
    user : user,
    playlist : playlist
};