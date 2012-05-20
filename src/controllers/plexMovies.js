var http_utils = require('../utils/http_utils');
var plex_utils = require('../utils/plex_utils');
var data_utils = require('../utils/data_utils');

module.exports = function(app){

    app.param('movieId', function(req, res, next, movieId){
        var authToken = req.server.hasOwnProperty('accessToken') ? req.server.accessToken : req.session.plexToken;
        var options = {
            host: req.server.host,
            port: req.server.port,
            path: '/library/metadata/' + movieId + '?X-Plex-Token=' + encodeURIComponent(authToken)
        };
        http_utils(false, options, 'xml', function(data) {
            req.video = data;
            plex_utils.buildPhotoBaseTranscodeUrl(authToken, req.server, [data.Video], "thumb");

            next();
            return;
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });
    });

    app.get('/servers/:serverId/library/movies/:movieId/', function(req, res, next) {
        var authToken = req.server.hasOwnProperty('accessToken') ? req.server.accessToken : req.session.plexToken;
        res.render('movies/view.jade', { video: req.video.Video, server: req.server, authToken: authToken});
    });

    app.get('/servers/:serverId/library/movies/:movieId/hls/*', function(req, res, next) {
        var authToken = req.server.hasOwnProperty('accessToken') ? req.server.accessToken : req.session.plexToken;
        var capabilities = "protocols=webkit;videoDecoders=h264{profile:high&resolution:1080&level:51};audioDecoders=mp3,aac";

        var transcodeInfo = plex_utils.buildVideoTranscodeUrlHLS(req.video.Video.Media.Part.key, 0, 5, false);
        transcodeInfo.url += "&X-Plex-Token=" + encodeURIComponent(authToken);
        transcodeInfo.url += "&X-Plex-Client-Capabilities=" + encodeURIComponent(capabilities);

        var options = {
            host: req.server.host,
            port: req.server.port,
            head: transcodeInfo.headers,
            path: transcodeInfo.url
        };
        http_utils(false, options, 'none', function(data) {
            var playlist = data.replace("session/", "http://" + req.server.host + ":" + req.server.port + "/video/:/transcode/segmented/session/");
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
    });

};