module.exports = function(io) {
    var express = require('express');
    var router = express.Router();
    var playlist = require('../modules/database').playlist;

    /* GET home page. */
    router.get('/', function(req, res, next) {
        if(req.user){
            if(req.user.isAdmin) {
                playlist.find({}, function (err, list) {
                    playlist.find({ flag : false}, function (err, clist) {
                        var no;
                        if(clist[0] == undefined){
                            for(var i = 0; i < list.length; i++){
                                list[i].flag = false;
                                list[i].save(function (err) {
                                    if(err) console.log('flag save error');
                                })
                            }
                            no = Math.floor(Math.random() * list.length) + 0;
                            res.render('player', { title: 'Youtube Player' , vid: list[no].vid});
                        }
                        else{
                            no = Math.floor(Math.random() * clist.length) + 0;
                            res.render('player', { title: 'Youtube Player' , vid: clist[no].vid});
                        }
                    });
                });
            }else {
                req.logout();
                res.redirect('/')
            }
        }
        else res.redirect('/');
    });

    var soc = io.of('/player');
    soc.on('connection', function (socket) {
        socket.on('eov', function (data) {
            playlist.findOne({vid : data.vid}, function (err, song) {
                song.flag = true;
                song.save(function (err) {
                    if(err) console.log('flag save error');
                })
            });
        });
    });


    return router;

};
