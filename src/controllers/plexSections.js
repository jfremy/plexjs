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