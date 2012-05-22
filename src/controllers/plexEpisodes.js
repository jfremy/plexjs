var http_utils = require('../utils/http_utils');
var plex_utils = require('../utils/plex_utils');
var data_utils = require('../utils/data_utils');

module.exports = function(app) {
    app.param('episodeId', function(req, res, next, episodeId) {
        // We already have this element
        //TODO: allow to force refresh (get param probably since this can become outdated, currently, just switch shows and come back and will be updated
        if(req.session.hasOwnProperty("episode") && req.session.episode.ratingKey == episodeId) {
            next();
            return;
        }
        var authToken = plex_utils.getAuthToken(req);
        var options = {
            host: req.session.server.host,
            port: req.session.server.port,
            path: '/library/metadata/' + episodeId + '?X-Plex-Token=' + encodeURIComponent(authToken)
        };
        http_utils(false, options, 'xml', function(data) {
            req.session.episode = data.Video;
            plex_utils.buildPhotoBaseTranscodeUrl(authToken, req.session.server, [req.session.episode], "thumb");
            //TODO: other images that need to be transcoded? poster, theme ...
            next();
            return;
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });
    });

    // List
    app.get('/servers/:serverId/library/shows/:showId/seasons/:seasonId/episodes/', function(req, res, next){
        var authToken = plex_utils.getAuthToken(req);
        var options ={
            host: req.session.server.host,
            port: req.session.server.port,
            path: '/library/metadata/' + req.param('seasonId') + '/children?X-Plex-Token=' + encodeURIComponent(authToken)
        };
        http_utils(false, options , 'xml', function(data) {
            data_utils.makeSureIsArray(data, "Video");
            plex_utils.buildPhotoBaseTranscodeUrl(authToken, req.session.server, data.Video, "thumb");
            res.render('episodes/list', {show: req.session.show, season: req.session.season, episodes: data.Video, server: req.session.server, authToken: authToken });
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });
    });
    // View episode
    app.get('/servers/:serverId/library/shows/:showId/seasons/:seasonId/episodes/:episodeId/', function(req, res, next){
        var authToken = plex_utils.getAuthToken(req);
        res.render('episodes/view',{show: req.session.show, season: req.session.season, episode: req.session.episode, server: req.session.server, authToken: authToken});
    });
    //Transcode URL
    app.get('/servers/:serverId/library/shows/:showId/seasons/:seasonId/episodes/:episodeId/hls/*', function(req, res, next) {
        var authToken = plex_utils.getAuthToken(req);
        var quality = req.param('quality', 5);
        var offset = req.param('offset', 0);
        var is3g = Boolean(req.param('is3g', false));

        var capabilities = "protocols=http-live-streaming,http-mp4-streaming,http-streaming-video,http-mp4-video,http-streaming-video-720p,http-streaming-video-1080p,http-mp4-video-720p,http-mp4-video-1080p;videoDecoders=h264{profile:high&resolution:1080&level:51},h264{profile:high&resolution:720&level:51};audioDecoders=mp3,aac";

        var transcodeInfo = plex_utils.buildVideoTranscodeUrlHLS(req.session.episode.Media.Part.key, offset, quality, is3g);
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