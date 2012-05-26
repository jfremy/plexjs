var http_utils = require('../utils/http_utils');
var data_utils = require('../utils/data_utils');
var plex_utils = require('../utils/plex_utils');

module.exports = function(app){

/*
    app.param('sectionId', function(req, res, next, sectionId) {
             var authToken = plex_utils.getAuthToken(req);
             retrieveSection(authToken, req.session.server, sectionId, function(section) {
            req.section = section;
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });
    });
*/

    app.get('/servers/:serverId/sections/', function(req, res, next){
        var authToken = plex_utils.getAuthToken(req);
        retrieveSectionsList(authToken, req.session.server, function(data) {
            data_utils.makeSureIsArray(data, "Directory");
            req.sections = data.Directory;
            http_utils.answerBasedOnAccept(req, res,'sections/list.jade', { sections: req.sections, server: req.session.server, authToken: authToken });
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });
    });

    app.get('/servers/:serverId/sections/:sectionId/', function(req, res, next) {
        res.end();
    });

    function retrieveSection(authToken, server, sectionId, success, failure) {

    }

    function retrieveSectionsList(authToken, server, success, failure) {
        var options = {
            host: server.host,
            port: server.port,
            path: '/library/sections/?X-Plex-Token=' + encodeURIComponent(authToken)
        };
        http_utils.request(false, options, 'xml', success, failure);
    }
};