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
var crypto = require('crypto');
var config = require('../config');
var http_utils = require('./http_utils');
var negotiate = require('express-negotiate');

module.exports = (function() {
    var captureSession = /^session\/([^\/]+)\/.*$/m;

    function buildPhotoBaseTranscodeUrl(authToken, server, videos, key) {
        var baseUrl = "http://" + server.host + ":" + server.port + "/photo/:/transcode?X-Plex-Token=" + authToken + "&url=";
        for(var i=0; i< videos.length; i++) {
            var video = videos[i];
            var localImageUrl;
            if(video.hasOwnProperty(key)) {
                // Use localhost as transcoding happens
                localImageUrl = "http://127.0.0.1:32400" + video[key];
                video[key + "TranscodeUrl"] = baseUrl + encodeURIComponent(localImageUrl);
            }
        }
        // Now all you have to do is add &width=xx&height=xx
    }

    function buildVideoTranscodeUrlSmooth(ratingKey, partUrl, offset, quality, is3g) {
        return buildVideoTranscodeUrlFromBase("/video/:/transcode/smooth?", ratingKey, partUrl, offset, quality, is3g);
    }

    function buildVideoTranscodeUrlHLS(ratingKey, partUrl, offset, quality, is3g) {
        return buildVideoTranscodeUrlFromBase("/video/:/transcode/segmented/start.m3u8?", ratingKey, partUrl, offset, quality, is3g);
    }

    function handleVideoTranscoding(req, res, next, ratingKey, key) {
        var authToken = getAuthToken(req);
        var quality = req.param('quality', 5);
        var offset = req.param('offset', 0);
        var is3g = Boolean(req.param('is3g', false));

        var transcodeUrl = buildVideoTranscodeUrlHLS(ratingKey, key, offset, quality, is3g);
        transcodeUrl += "&X-Plex-Token=" + encodeURIComponent(authToken);

        var options = {
            host: req.session.server.host,
            port: req.session.server.port,
            path: transcodeUrl
        };

        http_utils.request(false, options, 'none', function(data) {
            req.negotiate({
                'application/json': function() {
                    var url = data.match(captureSession);
                    res.json({
                            statusCode: 200,
                            transcodeURL: "http://" + req.session.server.host + ":" + req.session.server.port + "/video/:/transcode/segmented/" + url[0],
                            transcodeId: url[1]
                        }
                    );
                    return;
                },
                'application/x-mpegURL,html,default': function() {
                    var playlist = data.replace("session/", "http://" + req.session.server.host + ":" + req.session.server.port + "/video/:/transcode/segmented/session/");
                    res.contentType('stream.m3u8');
                    res.setHeader('Content-Disposition', 'inline; filename="stream.m3u8"');
                    res.end(playlist);
                    return;
                }
            });
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });

    }

    function handleSetAudioStream(req, res, next, partId, streamId) {
        handleSetStreamId(req, res, next, partId, 'audioStreamID', streamId);
    }

    function handleSetSubtitleStream(req, res, next, partId, streamId) {
        handleSetStreamId(req, res, next, partId, 'subtitleStreamID', streamId);
    }

    function handleSetStreamId(req, res, next, partId, streamName, streamId) {
        var authToken = getAuthToken(req);
        var options = {
            host: req.session.server.host,
            port: req.session.server.port,
            method: 'PUT',
            path: '/library/parts/' + partId + '?' + streamName + '=' + streamId + '&X-Plex-Token=' + authToken
        };

        http_utils.request(false, options, 'none', function(data) {
            res.statusCode = 204;
            res.end();
        }, function(err) {
            console.log(err.msg);
            res.statusCode = err.statusCode;
            res.end(err.msg);
            return;
        });
    }

    function buildVideoTranscodeUrlFromBase(base, ratingKey, partUrl, offset, quality, is3g) {
        var now = Math.round(new Date().getTime()/1000);
        var localVideoUrl = "http://127.0.0.1:32400" + partUrl;

        var transcodeUrl = base;
        transcodeUrl += "url=" + encodeURIComponent(localVideoUrl);
        transcodeUrl += "&identifier=com.plexapp.plugins.library";
        transcodeUrl += "&ratingKey=" + encodeURIComponent(ratingKey);
        transcodeUrl += "&offset=" + encodeURIComponent(offset);
        transcodeUrl += "&quality=" + encodeURIComponent(quality);
        transcodeUrl += "&3g=" + encodeURIComponent(is3g ? 1 : 0);
        transcodeUrl += "&subtitleSize=100";
        transcodeUrl += "&audioBoost=100";
        //transcodeUrl += "&httpCookies=&userAgent=";
        var msg = transcodeUrl + "@" + now;

        var hmac = crypto.createHmac('sha256', config.transcoding.privateKey).update(msg).digest('base64');

        var result = transcodeUrl;
        result += "&X-Plex-Access-Key=" + encodeURIComponent(config.transcoding.publicKey);
        result += "&X-Plex-Access-Time=" + encodeURIComponent(now);
        result += "&X-Plex-Access-Code=" + encodeURIComponent(hmac);

        result += "&X-Plex-Client-Capabilities=";

        var first = true;
        var capabilities = "";
        for(var k in config.transcoding.capabilities) {
            var cap = config.transcoding.capabilities[k];
            if(cap.length > 0) {
                if(first) {
                    first = false;
                } else {
                    capabilities += ";";
                }
                capabilities += k + "="
                capabilities += cap.join(',');
            }
        }
        result += encodeURIComponent(capabilities);
        return result;
    }

    function getAuthToken(req) {
        return (req.session.server.hasOwnProperty('accessToken') ? req.session.server.accessToken : req.session.plexToken);
    }

    function populateRatingKeyFromKey(array) {
        for(var i=0; i<array.length;i++) {
            var elem = array[i]
            if(!elem.hasOwnProperty("ratingKey") && elem.hasOwnProperty("key")) {
                var idx = elem.key.lastIndexOf("/");
                elem.ratingKey = elem.key.substring(idx+1);
            }
        }
    }

    return {
        buildPhotoBaseTranscodeUrl: buildPhotoBaseTranscodeUrl,
        handleVideoTranscoding: handleVideoTranscoding,
        handleSetAudioStream: handleSetAudioStream,
        handleSetSubtitleStream: handleSetSubtitleStream,
        getAuthToken: getAuthToken,
        populateRatingKeyFromKey: populateRatingKeyFromKey
    }

})();