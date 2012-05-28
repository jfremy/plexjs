module.exports = (function() {
    var options = {
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
            privateKey: new Buffer('k3U6GLkZOoNIoSgjDshPErvqMIFdE0xMTx8kgsrhnC0=', 'base64')
        }

    };
    return options;
})();