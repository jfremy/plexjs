var config = require('../config');
var http_utils = require('../utils/http_utils');
var data_utils = require('../utils/data_utils');

module.exports = function(app){

    app.param('serverId', function(req, res, next, serverId) {
        var server;

        if(!req.session.hasOwnProperty('plexServers')) {
            retrieveServersList(req.session.plexToken, function(data) {
                data_utils.makeSureIsArray(data, "Server");
                req.session.plexServers = data.Server;
                updateServerInSession(req, res, next, serverId);
                return;
            }, function(err) {
                console.log(err.msg);
                res.statusCode = err.statusCode;
                res.end(err.msg);
            });
            return;

        }
        updateServerInSession(req, res, next, serverId);
        return;
    });

    app.get('/servers/', function(req,res) {
        retrieveServersList(req.session.plexToken, function(data) {
            data_utils.makeSureIsArray(data, "Server");;
            req.session.plexServers = data.Server;
            http_utils.answerBasedOnAccept(req, res,'servers/list.jade', { plexServers: req.session.plexServers });
            return;
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });
    });

    app.get('/servers/:serverId/', function(req, res, next){
        res.end();
        return;
    });

    function updateServerInSession(req, res, next, serverId) {
        var server = findServerById(req.session.plexServers, serverId);
        if(!server) {
            res.status = 404;
            res.end("Could not find server in list");
            return;
        }
        req.session.server = server;
        next();
        return;
    }

    function findServerById(servers, id) {
        var server;

        for(var i=0;i<servers.length;i++) {
            if(servers[i].machineIdentifier == id) {
                server = servers[i];
                break;
            }
        }
        return server;
    }

    function retrieveServersList(authToken, success, failure) {
        var headers = config.myPlexHeaders;
        headers['Content-Length'] = 0;
        var options = {
            host: 'my.plexapp.com',
            headers: headers,
            path: '/pms/servers?X-Plex-Token=' + authToken
        };
        http_utils.request(true, options, 'xml', success, failure);
    }
};