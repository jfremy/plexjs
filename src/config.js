module.exports = (function() {
    var options = {
        server: {
            port: 8000,
            address: ''
        },
        myPlexHeaders: {
            'X-Plex-Platform': 'NodeJS',
            'X-Plex-Platform-Version': process.versions.node,
            'X-Plex-Provides': 'player',
            'X-Plex-Product': 'Plex Web Client',
            'X-Plex-Version': '0.1',
            'X-Plex-Device': '',
            'X-Plex-Client-Identifier': '123456789'
        },
        transcoding: {
            publicKey: 'KQMIY6GATPC63AIMC4R2',
            privateKey: new Buffer('k3U6GLkZOoNIoSgjDshPErvqMIFdE0xMTx8kgsrhnC0=', 'base64'),
            capabilities: {
                protocols: [
                    'http-live-streaming',
                    'http-mp4-streaming',
                    'http-streaming-video',
                    //'http-streaming-video-240p',
                    //'http-streaming-video-320p',
                    //'http-streaming-video-480p',
                    'http-streaming-video-720p',
                    'http-streaming-video-1080p',
                    'http-mp4-video',
                    //'http-mp4-video-240p',
                    //'http-mp4-video-320p',
                    //'http-mp4-video-480p',
                    'http-mp4-video-720p',
                    'http-mp4-video-1080p'
                ],
                videoDecoder: [  // Used for DirectStream
                    //'h264{profile:high&resolution:1080&level:51}',
                    //'h264{profile:high&resolution:720&level:51}',
                    //'h264{profile:baseline&resolution:480&level:30}'
                ],
                audioDecoder: [
                    'mp3',
                    'aac'//,
                    //'ac3{channels=6}'
                ]
            }
        }
    };
    return options;
})();