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
        http_utils(false, options, 'xml', function(data) {
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

    app.get('/servers/:serverId/library/movies/:movieId/', function(req, res, next) {
        var authToken = plex_utils.getAuthToken(req);
        res.render('movies/view.jade', { video: req.session.movie.Video, server: req.session.server, authToken: authToken});
    });

    app.get('/servers/:serverId/library/movies/:movieId/hls/*', function(req, res, next) {
        var authToken = plex_utils.getAuthToken(req);
        var quality = req.param('quality', 5);
        var offset = req.param('offset', 0);
        var is3g = Boolean(req.param('is3g', false));

        var capabilities = "protocols=http-live-streaming,http-mp4-streaming,http-streaming-video,http-mp4-video,http-streaming-video-720p,http-streaming-video-1080p,http-mp4-video-720p,http-mp4-video-1080p;videoDecoders=h264{profile:high&resolution:1080&level:51},h264{profile:high&resolution:720&level:51};audioDecoders=mp3,aac";

        var transcodeInfo = plex_utils.buildVideoTranscodeUrlHLS(req.session.movie.Video.Media.Part.key, offset, quality, is3g);
        transcodeInfo.url += "&X-Plex-Token=" + encodeURIComponent(authToken);
        transcodeInfo.url += "&X-Plex-Client-Capabilities=" + encodeURIComponent(capabilities);

        var options = {
            host: req.session.server.host,
            port: req.session.server.port,
            headers: transcodeInfo.headers,
            path: transcodeInfo.url
        };
        http_utils(false, options, 'none', function(data) {
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
    });

};