/*
 PlexJS - Node.JS Plex media player web client
 Copyright (C) 2012  Jean-François Remy (jeff@melix.org)

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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
        if(seasonId == "allLeaves") {
            // Special case, we are getting every single episode
            next();
            return;
        }
        var authToken = plex_utils.getAuthToken(req);
        var options = {
            host: req.session.server.host,
            port: req.session.server.port,
            path: '/library/metadata/' + seasonId + '?X-Plex-Token=' + encodeURIComponent(authToken)
        };
        http_utils.request(false, options, 'xml', function(data) {
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

    // List seasons
    app.get('/servers/:serverId/library/shows/:showId/seasons/', function(req, res, next){
        var authToken = plex_utils.getAuthToken(req);
        var options ={
            host: req.session.server.host,
            port: req.session.server.port,
            path: '/library/metadata/' + req.param('showId') + '/children?X-Plex-Token=' + encodeURIComponent(authToken)
        };
        http_utils.request(false, options , 'xml', function(data) {
            data_utils.makeSureIsArray(data, "Directory");
            plex_utils.populateRatingKeyFromKey(data.Directory);
            plex_utils.buildPhotoBaseTranscodeUrl(authToken, req.session.server, data.Directory, "thumb");
            http_utils.answerBasedOnAccept(req, res,'seasons/list', {show: req.session.show, seasons: data.Directory, server: req.session.server, authToken: authToken });
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });
    });

    app.get('/servers/:serverId/library/shows/:showId/seasons/')

    // View season
    app.get('/servers/:serverId/library/shows/:showId/seasons/:seasonId/', function(req, res, next){
        //TODO: todo
        next();
    });
};