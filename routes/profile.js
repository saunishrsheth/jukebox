module.exports = function(io) {
    var express = require('express');
    var router = express.Router();
    var Youtube = require('youtube-node');
    var playlist = require('../modules/database').playlist;

    var youTube = new Youtube();
    youTube.setKey('AIzaSyCfazsdiSlW34achxCUt5flCojEoYA_gK4');

    var gsocket = io.of('/global');

    /* GET home page. */
    router.get('/', function (req, res, next) {
        if (!req.user) res.redirect('/?message=User is logged out');
        else {
            res.render('profile', {title: 'Profile', user : req.user, data : null});
        }
    });

    router.post('/', function (req, res, next) {
        if(req.user){
            if(req.body.submit_search === "Submit"){
                youTube.search(req.body.search, 10, function (error, result) {
                    if (error) res.redirect('/profile/'+req.user.name.firstName+'/?message=some error');
                    else {
                        var data = [];
                        for(var i = 0; i < result.items.length; i++) {
                            if (!result.items[i].id.videoId) continue;
                            else {
                                data.push({
                                    video_id: result.items[i].id.videoId,
                                    title: result.items[i].snippet.title,
                                    description: result.items[i].snippet.description,
                                    image: result.items[i].snippet.thumbnails.default.url
                                });
                            }
                        }
                        res.render('profile', {title: 'Youtube box',user : req.user, data : data});
                    }
                });
            }

            var nsp = io.of('/'+req.user.uid);
            nsp.on('connection', function(socket){
                socket.on('add', function(data){
                    playlist.findOne({vid : data.video_id}, function (err, song) {
                        if(song){
                            nsp.emit('song_add', {response : 'failed', data : 'song already in playlist' });
                        }
                        else{
                            var song = new playlist({
                                vid : data.video_id,
                                title : data.title,
                                description : data.description,
                                image : data.image,
                                addedby : req.user.uid,
                                flag : false,
                                priority : "HIGH"
                            });
                            song.save(function (err) {
                                if(!err){
                                    nsp.emit('song_add', {response : 'success', data : null });
                                    playlist.find({}, function (err, list) {
                                        if(!err) gsocket.emit('playlist', { playlist : list});
                                    })
                                }
                            })
                        }
                    });

                });
            });

        }
        else res.redirect('/?message=User not logged in')
    });



    gsocket.on('connection', function(socket){
        playlist.find({}, function (err, list) {
            if(!err) gsocket.emit('playlist', { playlist : list});
        })
    });

    return router;

};
