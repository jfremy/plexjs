var http_utils = require('../utils/http_utils');
var plex_utils = require('../utils/plex_utils');
var data_utils = require('../utils/data_utils');

module.exports = function(app){

    app.param('movieId', function(req, res, next, movieId){
        if(req.session.hasOwnProperty("movie") && req.session.movie.ratingKey == movieId) {
            next();
            return;
        }
        var authToken = plex_utils.getAuthToken(req);
        var options = {
            host: req.session.server.host,
            port: req.session.server.port,
            path: '/library/metadata/' + movieId + '?X-Plex-Token=' + encodeURIComponent(authToken)
        };
        http_utils.request(false, options, 'xml', function(data) {
            req.session.movie = data;
            plex_utils.buildPhotoBaseTranscodeUrl(authToken, req.session.server, [data.Video], "thumb");
            next();
            return;
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });
    });

    //get details for a given movie
    app.get('/servers/:serverId/library/movies/:movieId/', function(req, res, next) {
        var authToken = plex_utils.getAuthToken(req);
        http_utils.answerBasedOnAccept(req, res,'movies/view.jade', { video: req.session.movie.Video, server: req.session.server, authToken: authToken});
    });

    app.get('/servers/:serverId/library/movies/:movieId/hls/*', function(req, res, next) {
        var authToken = plex_utils.getAuthToken(req);
        var quality = req.param('quality', 5);
        var offset = req.param('offset', 0);
        var is3g = Boolean(req.param('is3g', false));

        var transcodeUrl = plex_utils.buildVideoTranscodeUrlHLS(req.session.movie.Video.Media.Part.key, offset, quality, is3g);
        transcodeUrl += "&X-Plex-Token=" + encodeURIComponent(authToken);

        var options = {
            host: req.session.server.host,
            port: req.session.server.port,
            path: transcodeUrl
        };

        req.negotiate({
            'application/json': function() {
                var url = "http://" + req.session.server.host + ":" + req.session.server.port + transcodeUrl;
                res.json({ statusCode: 200, transcodeURL: url });
                return;
            },
            'application/x-mpegURL,html,default': function() {
                http_utils.request(false, options, 'none', function(data) {
                    var playlist = data.replace("session/", "http://" + req.session.server.host + ":" + req.session.server.port + "/video/:/transcode/segmented/session/");
                    res.contentType('stream.m3u8');
                    res.setHeader('Content-Disposition', 'inline; filename="stream.m3u8"');
                    res.end(playlist);
                    return;
                }, function(err) {
                    console.log(err.msg);
                    res.statusCode = err.statusCode;
                    res.end(err.msg);
                    return;
                });
            }
        });
    });

};