var crypto = require('crypto');

module.exports = (function() {
    function buildPhotoBaseTranscodeUrl(authToken, server, videos, key) {
        var baseUrl = "http://" + server.host + ":" + server.port + "/photo/:/transcode?X-Plex-Token=" + authToken + "&url=";
        for(var i=0; i< videos.length; i++) {
            var video = videos[i];
            var localImageUrl;
            if(video.hasOwnProperty(key)) {
                // Use localhost as transcoding happens locally but keep port
                localImageUrl = "http://127.0.0.1:32400" + video[key];
                video[key + "TranscodeUrl"] = baseUrl + encodeURIComponent(localImageUrl);
            }
        }
        // Now all you have to do is add &width=xx&height=xx
    }

    function buildVideoTranscodeUrlSmooth(partUrl, offset, quality, is3g) {
        return buildVideoTranscodeUrlFromBase("/video/:/transcode/smooth?", partUrl, offset, quality, is3g);
    }

    function buildVideoTranscodeUrlHLS(partUrl, offset, quality, is3g) {
        return buildVideoTranscodeUrlFromBase("/video/:/transcode/segmented/start.m3u8?", partUrl, offset, quality, is3g);
    }

    function buildVideoTranscodeUrlFromBase(base, partUrl, offset, quality, is3g) {
        var publicKey = 'KQMIY6GATPC63AIMC4R2';
        var privateKey = new Buffer('k3U6GLkZOoNIoSgjDshPErvqMIFdE0xMTx8kgsrhnC0=', 'base64');


        var now = Math.round(new Date().getTime()/1000);
        var localVideoUrl = "http://127.0.0.1:32400" + partUrl;

        var transcodeUrl = base;
        transcodeUrl += "url=" + encodeURIComponent(localVideoUrl);
        //transcodeUrl += "identifier=com.plexapp.plugins.library";
        //transcodeUrl += "&ratingKey=" + encodeURIComponent(ratingKey);
        transcodeUrl += "&offset=" + encodeURIComponent(offset);
        transcodeUrl += "&quality=" + encodeURIComponent(quality);
        transcodeUrl += "&3g=" + encodeURIComponent(is3g ? 1 : 0);
        //transcodeUrl += "&httpCookies=&userAgent=";
        var msg = transcodeUrl + "@" + now;

        var hmac = crypto.createHmac('sha256', privateKey).update(msg).digest('base64');

        var result = {
            url: transcodeUrl,
            headers: {
                "X-Plex-Access-Key": publicKey,
                "X-Plex-Access-Time": now,
                "X-Plex-Access-Code": hmac
            }
        };
        return result;
    }

    function getAuthToken(req) {
        return (req.session.server.hasOwnProperty('accessToken') ? req.session.server.accessToken : req.session.plexToken);
    }

    return {
        buildPhotoBaseTranscodeUrl: buildPhotoBaseTranscodeUrl,
        buildVideoTranscodeUrlHLS: buildVideoTranscodeUrlHLS,
        buildVideoTranscodeUrlSmooth: buildVideoTranscodeUrlSmooth,
        getAuthToken: getAuthToken
    }

})();