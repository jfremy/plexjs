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
var negotiate = require('express-negotiate');
var config = require('../config');
var http_utils = require('../utils/http_utils');

module.exports = function(app) {
    app.all('/*', function(req, res, next) {
        if(!req.session.plexToken && req.url.indexOf("/public/") != 0 && req.url.indexOf('/login') != 0 ) {
            req.negotiate({
                'application/json': function() {
                    res.statusCode = 401;
                    res.json({ statusCode: 401, msg: "Unauthorized"});
                },
                'html,default': function() {
                    res.statusCode = 302;
                    res.setHeader("Location", "/public/login.html?redirectTo=" + encodeURIComponent(req.url));
                    res.end();
                }
            });
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
            auth: user + ':' + password
        };
        signinOptions.headers = config.myPlexHeaders;
        signinOptions.headers['Content-Length'] = 0;


        http_utils.request(true, signinOptions, 'json', function(authentResult) {
            req.session.plexToken = authentResult.user['authentication_token'];
            req.session.plexUser = authentResult.user['username'];
            req.session.plexEmail = authentResult.user['email'];

            console.log("MyPlex [" + new Date().toUTCString() + "] User logged in " + req.session.plexUser);

            req.negotiate({
                'application/json': function() {
                    res.statusCode = 201;
                    var answer = {statusCode: 201, msg: "Logged in", sid: req.sessionID };
                    res.json(answer);
                },
                'html,default': function() {
                    res.statusCode = 302;
                    res.setHeader("Location", redirectTo);
                    res.end();
                }
            });
            return;
        }, function(err) {
            console.log(err);
            req.negotiate({
                'application/json': function() {
                    res.statusCode = 401;
                    res.json(err);
                },
                'html,default': function() {
                    res.statusCode = 302;
                    res.setHeader("Location", "/public/login.html?reason=failed&redirectTo=" + encodeURIComponent(redirectTo));
                    res.end();
                }
            });
            return;
        });
    });

    app.get('/logout', function(req, res, next) {
        var signoutOptions = {
            host: 'my.plexapp.com',
            path: '/users/sign_out.json'
        };
        http_utils.request(true, signoutOptions, 'text', function() {
            console.log("MyPlex [" + new Date().toUTCString() + "] Logged out: " + req.session.plexUser);
            delete req.session.plexToken;

            req.negotiate({
                'application/json': function() {
                    res.statusCode = 200;
                    var answer = {statusCode: 200, msg: "Logged out", sid: req.sessionID };
                    res.json(answer);
                },
                'html,default': function() {
                    res.statusCode = 302;
                    res.setHeader("Location", "/public/login.html");
                    res.end();
                }
            });
            return;
        }, function(err) {
            console.log(err);
            req.negotiate({
                'application/json': function() {
                    res.statusCode = 401;
                    res.json(err);
                },
                'html,default': function() {
                    res.statusCode = 302;
                    res.setHeader("Location", "/public/login.html?reason=failed&redirectTo=" + encodeURIComponent(redirectTo));
                    res.end();
                }
            });
            return;
        });
    });
};