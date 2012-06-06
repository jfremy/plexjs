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

module.exports = function(app){
    var invalidated = false; // Should we force refresh (set to true after an action that changes the state of the element takes place)

    app.param('movieId', function(req, res, next, movieId){
        if(!invalidated && req.session.hasOwnProperty("movie") && req.session.movie.ratingKey == movieId) {
            next();
            return;
        }

        invalidated = false;
        var authToken = plex_utils.getAuthToken(req);
        var options = {
            host: req.session.server.host,
            port: req.session.server.port,
            path: '/library/metadata/' + movieId + '?X-Plex-Token=' + encodeURIComponent(authToken)
        };
        http_utils.request(false, options, 'xml', function(data) {
            req.session.movie = data.Video;
            data_utils.makeSureIsArray(req.session.movie.Media, "Part");
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
        http_utils.answerBasedOnAccept(req, res,'movies/view.jade', { video: req.session.movie, server: req.session.server, authToken: authToken});
    });

    app.get('/servers/:serverId/library/movies/:movieId/hls/*', function(req, res, next) {
        plex_utils.handleVideoTranscoding(req, res, next, req.session.movie.ratingKey, req.session.movie.Media.Part[0].key);
    });

    // Change audio stream
    app.put('/servers/:serverId/library/movies/:movieId/audioStream', function(req, res, next) {
        var movie = req.session.movie;
        var streamId = req.param('audioStreamId');

        invalidated = true;

        if(movie.Media.Part.length > 1 || movie.Media.Part.length == 0) {
            var msg = "Cannot set global audiostream with multiple parts";
            console.log(msg);
            res.statusCode(400);
            res.end(msg);
        }
        plex_utils.handleSetAudioStream(req, res, next, movie.Media.Part[0].id, streamId);



    });

    // Change subtitle stream
    app.put('/servers/:serverId/library/movies/:movieId/subtitleStream', function(req, res, next) {
        var movie = req.session.movie;
        var streamId = req.param('subtitleStreamId');

        invalidated = true;

        if(movie.Media.Part.length > 1 || movie.Media.Part.length == 0) {
            var msg = "Cannot set global audiostream with multiple parts";
            console.log(msg);
            res.statusCode(400);
            res.end(msg);
        }
        plex_utils.handleSetSubtitleStream(req, res, next, movie.Media.Part[0].id, streamId);
    });
};