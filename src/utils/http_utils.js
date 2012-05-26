var http = require('http');
var https = require('https');
var xml2js = require('xml2js');
var negotiate = require('express-negotiate');
var http_utils = require('../utils/http_utils');

module.exports = (function() {
    function request(secure, options, type, success, failure) {
        console.log(options);
        var serverReq = (secure ? https : http).request(options, function(serverRes) {
            var result = "";
            serverRes.setEncoding('utf8');
            serverRes.on('data', function(chunk){
                result += chunk;
            });
            serverRes.on('end', function(){
                if(serverRes.statusCode >= 400) {
                    failure({statusCode: serverRes.statusCode, msg: "Error contacting server"});
                    return;
                }
                if(type == 'xml') {
                    var parser = new xml2js.Parser({ mergeAttrs: true });
                    parser.parseString(result, function(err, data) {
                        if(data.hasOwnProperty('size')) {
                            if(data.size == "0") {
                                // Return 404 when accessing an empty MediaContainer
                                failure({statusCode: 404, msg: "Server returned an empty answer"});
                                return;
                            }
                        }
                        success(data);
                        return;
                    });
                    return;
                }
                if(type == 'json') {
                    success(JSON.parse(result));
                    return;
                }
                success(result);
                return;
            });

        }).on('error', function(err) {
                failure({statusCode: 500, msg: err.message});
                return;
            }).end();
    }

    function answerBasedOnAccept(req, res, viewName, data) {
        // Two options. Either Accept content-type is set to 'application/json', in which case, we just return
        // the json data in the response
        // Otherwise, we return the rendered page
        req.negotiate({
            "application/json": function() {
                res.contentType('application/json');
                res.json(data);
            },
            "html,default": function() {
                res.render(viewName, data);
            }
        });
    }

    return {
        request: request,
        answerBasedOnAccept: answerBasedOnAccept
    }
})();