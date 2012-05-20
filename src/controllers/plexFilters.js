var http_utils = require('../utils/http_utils');
var plex_utils = require('../utils/plex_utils');
var data_utils = require('../utils/data_utils');

module.exports = function(app){

    app.get('/servers/:serverId/sections/:sectionId/filters/', function(req, res, next) {
        var authToken = req.server.hasOwnProperty('accessToken') ? req.server.accessToken : req.session.plexToken;

        retrieveFiltersList(authToken, req.server, req.params.sectionId, function(data){
            data_utils.makeSureIsArray(data, "Directory");
            res.render('filters/list.jade', { filters: data.Directory, server: req.server, authToken: authToken, backTrace: "../.." });
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });

    });

    app.get('/servers/:serverId/sections/:sectionId/filters/:filterId/', function(req, res, next) {
         processFilter(req, res, next, '/' + req.params.filterId, '../../..');
    });

    app.get('/servers/:serverId/sections/:sectionId/filters/:filterId/:filterId2/', function(req, res, next) {
        processFilter(req, res, next, '/' + req.params.filterId + '/' + req.params.filterId2, '../../../..');
    });


    function processFilter(req, res, next, filtersString, backTraceString) {
        var authToken = req.server.hasOwnProperty('accessToken') ? req.server.accessToken : req.session.plexToken;
        var options = {
            host: req.server.host,
            port: req.server.port,
            path: '/library/sections/' + req.params.sectionId + filtersString +'?X-Plex-Token=' + encodeURIComponent(authToken)
        };

        http_utils(false, options , 'xml', function(data) {
            var viewgroup = data["viewGroup"] || "";
            // List of videos
            if(viewgroup == "movie") {
                data_utils.makeSureIsArray(data, "Video");
                plex_utils.buildPhotoBaseTranscodeUrl(authToken, req.server, data.Video, "thumb");
                res.render('movies/list.jade', { videos: data.Video, server: req.server, authToken: authToken, backTrace: backTraceString });
                return;
            }
            if(viewgroup == "show") {
                data_utils.makeSureIsArray(data, "Directory");
                plex_utils.buildPhotoBaseTranscodeUrl(authToken, req.server, data.Directory, "thumb");
                res.render('shows/list.jade', { shows: data.Directory, server: req.server, authToken: authToken, backTrace: backTraceString});
                return;
            }
            if(viewgroup == "episode") {
                data_utils.makeSureIsArray(data, "Video");
                plex_utils.buildPhotoBaseTranscodeUrl(authToken, req.server, data.Video, "thumb");
                res.render('episodes/list.jade', { episodes: data.Video, server: req.server, authToken: authToken, backTrace: backTraceString});
                return;
            }

            // TODO add audio / pictures ... later
            // Default to rendering a directory structure
            data_utils.makeSureIsArray(data, "Directory");
            res.render('filters/list.jade', { filters: data.Directory || new Array(), server: req.server, backTrace: backTraceString });
            return;
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });
    }


    function retrieveFiltersList(authToken, server, sectionId, success, failure) {
        var options = {
            host: server.host,
            port: server.port,
            path: '/library/sections/' + sectionId + '?X-Plex-Token=' + encodeURIComponent(authToken)
        };
        http_utils(false, options, 'xml', success, failure);
    }
};