var http_utils = require('../utils/http_utils');

module.exports = function(app) {
    app.all('/*', function(req, res, next) {
        if(!req.session.plexToken && req.url.indexOf("/public/") != 0 && req.url.indexOf('/login') != 0 ) {
            res.statusCode = 302;
            res.setHeader("Location", "/public/login.html?redirectTo=" + encodeURIComponent(req.url));
            res.end();
            return;
        }
        next();
        return;
    });

    app.post('/login', function(req, res, next) {
        var user, password, redirectTo, headers;
        user = req.param("username","");
        password = req.param("password","");
        redirectTo = req.param("redirectTo","/servers/");

        var signinOptions = {
            host: 'my.plexapp.com',
            path: '/users/sign_in.json',
            method: 'POST',
            auth: user + ':' + password,
            headers: {
                'Content-Length': 0,
                'X-Plex-Platform': 'NodeJS',
                'X-Plex-Platform-Version': process.versions.node,
                'X-Plex-Provides': 'player',
                'X-Plex-Product': 'Plex Web Client',
                'X-Plex-Version': '0.1',
                'X-Plex-Device': '',
                'X-Plex-Client-Identifier': '123456789'
            }
        };
        http_utils(true, signinOptions, 'json', function(authentResult) {
            req.session.plexToken = authentResult.user['authentication_token'];
            req.session.plexUser = authentResult.user['username'];
            req.session.plexEmail = authentResult.user['email'];

            console.log("User logged in " + req.session.plexUser);
            res.statusCode = 302;
            res.setHeader("Location", redirectTo);
            res.end();
            return;
        }, function(err) {
            console.log(err);
            res.statusCode = 302;
            res.setHeader("Location", "/public/login.html?reason=failed&redirectTo=" + encodeURIComponent(redirectTo));
            res.end();
            return;
        });
    });
};