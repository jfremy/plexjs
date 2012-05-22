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
        //TODO: todo
        next();
    });
};