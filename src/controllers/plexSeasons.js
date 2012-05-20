var http_utils = require('../utils/http_utils');
var plex_utils = require('../utils/plex_utils');
var data_utils = require('../utils/data_utils');

module.exports = function(app) {
    app.param('seasonId', function(req, res, next, seasonId) {
        // We already have this element
        //TODO: allow to force refresh (get param probably since this can become outdated, currently, just switch shows and come back and will be updated
        if(req.session.hasOwnProperty("season") && req.session.season.ratingKey == seasonId) {
            next();
            return;
        }
        var authToken = plex_utils.getAuthToken(req);
        var options = {
            host: req.session.server.host,
            port: req.session.server.port,
            path: '/library/metadata/' + seasonId + '?X-Plex-Token=' + encodeURIComponent(authToken)
        };
        http_utils(false, options, 'xml', function(data) {
            req.session.season = data.Directory;
            plex_utils.buildPhotoBaseTranscodeUrl(authToken, req.session.server, [req.session.season], "thumb");
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
    app.get('/servers/:serverId/library/shows/:showId/seasons/', function(req, res, next){
        var authToken = plex_utils.getAuthToken(req);
        var options ={
            host: req.session.server.host,
            port: req.session.server.port,
            path: '/library/metadata/' + req.params.showId + '/children?X-Plex-Token=' + encodeURIComponent(authToken)
        };
        http_utils(false, options , 'xml', function(data) {
            data_utils.makeSureIsArray(data, "Directory");
            plex_utils.buildPhotoBaseTranscodeUrl(authToken, req.session.server, data.Directory, "thumb");
            res.render('seasons/list', {show: req.session.show, seasons: data.Directory, server: req.session.server, authToken: authToken });
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });
    });
    // View season
    app.get('/servers/:serverId/library/shows/:showId/seasons/:seasonId/', function(req, res, next){
        //TODO: todo
        next();
    });
};