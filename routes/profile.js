module.exports = function (io) {
    var express = require('express');
    var router = express.Router();
    var Youtube = require('youtube-node');
    var playlist = require('../modules/database').playlist;
    var likes = require('../modules/dbOperation').like;
    var dislikes = require('../modules/dbOperation').dislike;
    var viewPlaylist = require('../modules/dbOperation').viewPlaylist;
    var addSong = require('../modules/dbOperation').addsong;

    var youTube = new Youtube();
    youTube.setKey('AIzaSyCfazsdiSlW34achxCUt5flCojEoYA_gK4');

    router.use('/', function (req, res, next) {
        if (req.user) next();
        else res.redirect('/?message=User is not logged in')
    });

    /* GET home page. */
    router.get('/', function (req, res, next) {
        res.render('profile', {title: 'Profile', user: req.user, data: null});
    });
    router.post('/', function (req, res, next) {
        if (req.body.submit_search === "Submit") {
            youTube.search(req.body.search, 10, function (error, result) {
                if (error) res.redirect('/profile/' + req.user.name.firstName + '/?message=some error');
                else {
                    var data = [];
                    for (var i = 0; i < result.items.length; i++) {
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
                    res.render('profile', {title: 'Youtube box', user: req.user, data: data});
                }
            });
        }
    });

    var gsocket = io.of('/global');

    gsocket.on('connection', function (socket) {
        socket.on('hello', function (data) {
            viewPlaylist(data.uid).then(function (value) {
                socket.emit('playlist',{ playlist : value.playlist, likes_dislikes : value.likes_dislikes , uid : data.uid });
            },function (err) {
                console.log(err);
            });
        });


        socket.on('like', function (data) {
            likes(data.vid, data.uid).then(function (value) {
                viewPlaylist(data.uid).then(function (result) {
                    socket.emit('playlist', { playlist : result.playlist, likes_dislikes : result.likes_dislikes , uid : data.uid });
                }, function (errors) {
                    console.log(errors);
                })
            }, function (err) {
                console.log(err);
            });
        });

        socket.on('dislike', function (data) {
            dislikes(data.vid, data.uid).then(function (value) {
                viewPlaylist(data.uid).then(function (result) {
                    socket.emit('playlist', { playlist : result.playlist, likes_dislikes : result.likes_dislikes , uid : data.uid });
                }, function (errors) {
                    console.log(errors);
                })
            }, function (err) {
                console.log(err);
            });
        });


        socket.on('add', function (data) {
            addSong(data.video_id, data.title, data.description, data.image, data.uid).then(function (value) {
                viewPlaylist(data.uid).then(function (result) {
                    gsocket.emit('playlist', { playlist : result.playlist, likes_dislikes : result.likes_dislikes , uid : data.uid });
                }, function (errors) {
                    console.log(errors);
                });
            },function (err) {
                console.log(err);
            });
        });
    });

    var nsocket = io.of('/now');
    nsocket.on('connection', function (socket) {
        socket.on('nowPlaying', function (data) {
            playlist.findOne({vid: data.currentSong}, function (err, song) {
                gsocket.emit('nowPlaying', {song: song});
            });
        })
    });


    return router;

};
