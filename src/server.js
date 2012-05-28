var express = require('express');
var config = require('./config');

var app = express.createServer();
app.use(express.logger());
app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.responseTime());
//TODO: add memcached session handler
app.use(express.session({ secret: "keyboard cat", key: "sid" }));

// Static content
app.use('/public', express.static(__dirname + '/public'));

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

app.listen(config.server.port,config.server.address);