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
var express = require('express');
var config = require('./config');
var redis = require('redis');
var RedisStore = require('connect-redis')(express);
var RedisClient = redis.createClient(config.redisServer.port, config.redisServer.host);

var app = express.createServer();
app.use(express.logger());
app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
app.use(express.bodyParser());
app.use(express.methodOverride());
// Seems it has to happen before cookieParser
app.use(express.cookieParser());
app.use(express.responseTime());
app.use(express.session({secret: config.session.secret, key: "sid", store: new RedisStore({ client: RedisClient})}));

// Static content
app.use('/public', express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    res.redirect('/public/index.html');
    res.end();
});

// Rendering engine
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.set('view options', { layout: false });

require('./controllers/plexMyPlex')(app);
require('./controllers/plexServers')(app);
require('./controllers/plexSections')(app);
require('./controllers/plexFilters')(app);
require('./controllers/plexMovies')(app);
require('./controllers/plexShows')(app);
require('./controllers/plexSeasons')(app);
require('./controllers/plexEpisodes')(app);
require('./controllers/plexVideoPlayback')(app);
require('./controllers/userSettings')(app, RedisClient);

app.listen(config.server.port,config.server.address);