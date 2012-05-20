var http_utils = require('../utils/http_utils');
var data_utils = require('../utils/data_utils');

module.exports = function(app){

/*
    app.param('sectionId', function(req, res, next, sectionId) {
        var authToken = req.server.hasOwnProperty('accessToken') ? req.server.accessToken : req.session.plexToken;
        retrieveSection(authToken, req.server, sectionId, function(section) {
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
        var authToken = req.server.hasOwnProperty('accessToken') ? req.server.accessToken : req.session.plexToken;

        retrieveSectionsList(authToken, req.server, function(data) {
            data_utils.makeSureIsArray(data, "Directory");
            req.sections = data.Directory;
            res.render('sections/list.jade', { sections: req.sections, server: req.server, authToken: authToken });
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
        http_utils(false, options, 'xml', success, failure);
    }
};