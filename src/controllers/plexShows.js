var http_utils = require('../utils/http_utils');
var plex_utils = require('../utils/plex_utils');
var data_utils = require('../utils/data_utils');

module.exports = function(app) {
    app.param('showId', function(req, res, next, showId) {
        // We already have this element
        //TODO: allow to force refresh (get param probably since this can become outdated, currently, just switch shows and come back and will be updated
        if(req.session.hasOwnProperty("show") && req.session.show.ratingKey == showId) {
            next();
            return;
        }
        var authToken = plex_utils.getAuthToken(req);
        var options = {
            host: req.session.server.host,
            port: req.session.server.port,
            path: '/library/metadata/' + showId + '?X-Plex-Token=' + encodeURIComponent(authToken)
        };
        http_utils.request(false, options, 'xml', function(data) {
            req.session.show = data.Directory;
            plex_utils.buildPhotoBaseTranscodeUrl(authToken, req.session.server, [req.session.show], "thumb");
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

    app.get('/servers/:serverId/library/shows/:showId/', function(req, res, next) {
        var authToken = req.session.server.hasOwnProperty('accessToken') ? req.session.server.accessToken : req.session.plexToken;
        res.render('shows/view.jade', {show: req.session.show, server: req.session.server, authToken: authToken});
    });

};