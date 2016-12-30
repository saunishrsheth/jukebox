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
    emailToken : {type : String},
    google : {
        access_token : { type : String },
        gid : {type : Number},
        name : {
            firstName : {type : String},
            lastName : {type : String}
        },
        email : { type : String },
        photo : { type : String },
        gender : { type : String }
    }
});

var playlistSchema = new schema({
    vid : { type : String, unique : true},
    title : {type : String},
    description : {type : String},
    image : {type : String},
    addedby : {type : String},
    flag : {type : Boolean},
    priority : {type : String},
    like_count : { type : Number},
    dislike_count : { type : Number }
});

var like_dislike_Schema = new schema({
    uid : { type : String},
    vid : { type : String},
    like : { type : Boolean},
    dislike : { type : Boolean}
});

var user = mongoose.model('users', userSchema);
var playlist = mongoose.model('playlist', playlistSchema);
var like_dislike = mongoose.model('like_dislike', like_dislike_Schema);

module.exports = {
    user : user,
    playlist : playlist,
    like_dislike : like_dislike
};