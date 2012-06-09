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
module.exports = (function() {
    var options = {
        server: {
            port: 8000,
            address: ''
        },
        redisServer: {
            host: '127.0.0.1',
            port: '6379'
        },
        session: {
            secret: '?I36r213}][;S+1~!O<3kv4V1]U<]o'
        },
        myPlexHeaders: {
            'X-Plex-Platform': 'NodeJS',
            'X-Plex-Platform-Version': process.versions.node,
            'X-Plex-Provides': 'player',
            'X-Plex-Product': 'Node.JS Plex media player web client',
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
                    //'http-streaming-video-720p',
                    'http-streaming-video-1080p',
                    'http-mp4-video',
                    //'http-mp4-video-240p',
                    //'http-mp4-video-320p',
                    //'http-mp4-video-480p',
                    //'http-mp4-video-720p',
                    'http-mp4-video-1080p'
                ],
                videoDecoders: [   //Used for DirectStream
                    //'h264{profile:high&resolution:1080&level:51}'
                    //'h264{profile:high&resolution:720&level:51}'
                    //'h264{profile:baseline&resolution:480&level:30}'
                ],
                audioDecoders: [
                    'mp3',
                    'aac{bitrate:160000}'//,
                    //'ac3{channels=6}'
                ]
            }
        }
    };
    return options;
})();