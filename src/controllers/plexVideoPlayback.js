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

module.exports = function(app){
    app.put('/playback/:transcodeId/state/ping', function(req, res, next) {

    });

    app.delete('/playback/:transcodeId', function(req, res, next) {
        var options = {
            host: req.session.server.host,
            port: req.session.server.port,
            path: '/video/:/transcode/segmented/stop',
            headers: {
                Cookie: 'SESSION-GUID=' + req.param('transcodeId')
            }
        };
        http_utils.request(false, options, 'none', function(data) {
            res.statusCode = 204;
            res.end();
            return;
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });
    });


};
