// Expect utf8decoder and utf8decoder to be TextEncoder('utf-8') and TextDecoder('utf-8') respectively
function messagehandler(keysystem, messageType, message) {

    var contentmetadata = this;

    const keySystems = {
        'com.widevine.alpha': {
            responseType: 'json',
            getLicenseMessage: function(response) {
                return base64DecodeToUnit8Array( response.license );
            },
            getErrorResponse: function(response) {
                return response;
            },
            getLicenseRequestFromMessage: function(message) {
                return new Uint8Array(message);
            },
            getRequestHeadersFromMessage: function(/*message*/) {
                return null;
            }
        },
        'com.microsoft.playready': {
            responseType: 'arraybuffer',
            getLicenseMessage: function(response) {
                return response;
            },
            getErrorResponse: function(response) {
                return String.fromCharCode.apply(null, new Uint16Array(response));
            },
            getLicenseRequestFromMessage: function(message) {
                var msg,
                    xmlDoc;
                var licenseRequest = null;
                var parser = new DOMParser();
                var dataview = new Uint16Array(message);

                msg = String.fromCharCode.apply(null, dataview);
                xmlDoc = parser.parseFromString(msg, 'application/xml');

                if (xmlDoc.getElementsByTagName('Challenge')[0]) {
                    var Challenge = xmlDoc.getElementsByTagName('Challenge')[0].childNodes[0].nodeValue;
                    if (Challenge) {
                        licenseRequest = atob(Challenge);
                    }
                }
                return licenseRequest;
            },
            getRequestHeadersFromMessage: function(message) {
                var msg,
                    xmlDoc;
                var headers = {};
                var parser = new DOMParser();
                var dataview = new Uint16Array(message);

                msg = String.fromCharCode.apply(null, dataview);
                xmlDoc = parser.parseFromString(msg, 'application/xml');

                var headerNameList = xmlDoc.getElementsByTagName('name');
                var headerValueList = xmlDoc.getElementsByTagName('value');
                for (var i = 0; i < headerNameList.length; i++) {
                    headers[headerNameList[i].childNodes[0].nodeValue] = headerValueList[i].childNodes[0].nodeValue;
                }
                // some versions of the PlayReady CDM return 'Content' instead of 'Content-Type'.
                // this is NOT w3c conform and license servers may reject the request!
                // -> rename it to proper w3c definition!
                if (headers.hasOwnProperty('Content')) {
                    headers['Content-Type'] = headers.Content;
                    delete headers.Content;
                }
                return headers;
            }
        }
    };

    return new Promise(function(resolve, reject) {

        readDrmConfig().then(function(response) {

            var protData = response[keysystem],
                url = undefined,
                reqheaders = {},
                credentials = undefined;

            if (protData) {
                if (protData.serverURL) {
                    url = protData.serverURL;
                    if(url.indexOf("azurewebsites") > 0) {
                        url += "SecureStop=1&UseSimpleNonPersistentLicense=1";
                        url += "&ContentKey=" + btoa(String.fromCharCode.apply(null, contentmetadata.keys[0].key));
                    }
                } else {
                    reject('Undefined serverURL');
                    return;
                }
            } else {
                reject('Unsupported keySystem');
                return;
            }

            // Ensure valid license server URL
            if (!url) {
                reject('DRM: No license server URL specified!');
                return;
            }

            // Set optional XMLHttpRequest headers from protection data and message
            var updateHeaders = function(headers) {
                var key;
                if (headers) {
                    for (key in headers) {
                        if ('authorization' === key.toLowerCase()) {
                            credentials = 'include';
                        }
                        reqheaders[key] = headers[key];
                    }
                }
            };

            if (protData) {
                updateHeaders(protData.httpRequestHeaders);
            }

            updateHeaders(keySystems[keysystem].getRequestHeadersFromMessage(message));

            // Set withCredentials property from protData
            if (protData && protData.withCredentials) {
                credentials = 'include';
            }

            fetch(url, {
                method: 'POST',
                headers: reqheaders,
                credentials: credentials,
                body: keySystems[keysystem].getLicenseRequestFromMessage(message)
            }).then(function(response) {
                if(response.status !== 200) {
                    reject('DRM: ' + keysystem + ' update, XHR status is "' + response.statusText + '" (' + response.status + '), expected to be 200. readyState is ' + response.readyState + '.  Response is ' + ((response) ? keySystems[keysystem].getErrorResponse(response) : 'NONE'));
                    return;
                } else {
                    if(keySystems[keysystem].responseType === 'json') {
                        return response.json();
                    } else if(keySystems[keysystem].responseType === 'arraybuffer') {
                        return response.arrayBuffer();
                    }

                }
            }).then(function(response){
                resolve(keySystems[keysystem].getLicenseMessage(response));
            }).catch(function(error) {
                reject(error);
                return;
            });
        });
    });
}

function readDrmConfig() {
    return fetch("/encrypted-media/content/drmconfig.json").then(function(response) {
        return response.json();
    });
}