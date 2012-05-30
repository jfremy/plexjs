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
        http_utils.request(false, options, 'xml', function(data) {
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
        var url = "/library/metadata/";
        var viewName = 'episodes/list';

        if(req.param('seasonId') == "allLeaves") {
            url += req.param('showId') + '/allLeaves';
            viewName = 'episodes/various';
        } else {
            url += req.param('seasonId') + '/children';
        }
        url += '?X-Plex-Token=' + encodeURIComponent(authToken);

        var options ={
            host: req.session.server.host,
            port: req.session.server.port,
            path: url
        };
        http_utils.request(false, options , 'xml', function(data) {
            data_utils.makeSureIsArray(data, "Video");
            plex_utils.buildPhotoBaseTranscodeUrl(authToken, req.session.server, data.Video, "thumb");
            http_utils.answerBasedOnAccept(req, res,viewName, {show: req.session.show, season: req.session.season, episodes: data.Video, server: req.session.server, authToken: authToken });
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
        http_utils.answerBasedOnAccept(req, res,'episodes/view',{show: req.session.show, season: req.session.season, episode: req.session.episode, server: req.session.server, authToken: authToken});
    });
    //Transcode URL
    app.get('/servers/:serverId/library/shows/:showId/seasons/:seasonId/episodes/:episodeId/hls/*', function(req, res, next) {
        plex_utils.handleVideoTranscoding(req, res, next, req.session.episode.ratingKey, req.session.episode.Media.Part.key);
    });
};