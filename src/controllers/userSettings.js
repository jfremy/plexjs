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

module.exports = function(app,rclient) {
    app.get('/user/', function(req, res, next) {
        getSettings(req.session.plexUser, function(err, obj) {
            if(!err) {

            } else {

            }
            res.end();
        });
    });

    app.get('/user/:settingId/', function(req,res,next){
        getSetting(req.session.plexUser, req.param('settingId'), function(err, obj) {

            res.end();
        });
    });

    app.put('/user/:settingId/', function(req, res, next) {
        setSetting(req.session.plexUser, req.param('settingId'), "");
        res.end();
    });

    function getSettings(plexUser, callback) {
        if(!plexUser) {
            callback({ message: "Invalid session, no plex user present"},{})
        }
        var key = "user:" + plexUser;

        rclient.hgetall(key, callback);
    }

    function getSetting(plexUser, settingId, callback) {
        getSettings(plexUser, function(err, obj) {
            var data = !err && obj.hasOwnProperty(settingId) ? obj[settingId] : "";
            callback(err, data);
        });
    }

    function setSetting(plexUser, settingId, value) {
        if(!plexUser) {
            return;
        }
        var key = "user:" + plexUser;
        rclient.sadd('users', key);
        rclient.hmset(key, settingId, value);
    }

    return {
        getSetting: getSetting,
        setSetting: setSetting,
        getSettings: getSettings
    };
};