// Expect utf8decoder and utf8decoder to be TextEncoder('utf-8') and TextDecoder('utf-8') respectively
//
// drmconfig format:
// { <keysystem> : {    "serverURL"             : <the url for the server>,
//                      "httpRequestHeaders"    : <map of HTTP request headers>,
//                      "servertype"            : "microsoft" | "drmtoday",                 // affects how request parameters are formed
//                      "certificate"           : <base64 encoded server certificate> } }
//

drmconfig = {
    "com.widevine.alpha": {
        "serverURL": "https://lic.staging.drmtoday.com/license-proxy-widevine/cenc/",
        "servertype" : "drmtoday",
        "httpRequestHeaders": {
            "dt-custom-data": "eyJ1c2VySWQiOiIxMjM0NSIsInNlc3Npb25JZCI6ImV3b2dJQ0p3Y205bWFXeGxJaUE2SUhzS0lDQWdJQ0p3ZFhKamFHRnpaU0lnT2lCN0lIMEtJQ0I5TEFvZ0lDSnZkWFJ3ZFhSUWNtOTBaV04wYVc5dUlpQTZJSHNLSUNBZ0lDSmthV2RwZEdGc0lpQTZJR1poYkhObExBb2dJQ0FnSW1GdVlXeHZaM1ZsSWlBNklHWmhiSE5sTEFvZ0lDQWdJbVZ1Wm05eVkyVWlJRG9nWm1Gc2MyVUtJQ0I5TEFvZ0lDSnpkRzl5WlV4cFkyVnVjMlVpSURvZ1ptRnNjMlVLZlFvSyIsIm1lcmNoYW50IjoiY2FibGVsYWJzIn0K"
        }
    },
/*
    "com.microsoft.playready": {
        "serverURL": "http://playready-testthis._drmconfigazurewebsites.net/rightsmanager.asmx?"
    },
    "com.microsoft.playready": {
        "serverURL": "http://playready.directtaps.net/pr/svc/rightsmanager.asmx?"
    },
*/
    "com.microsoft.playready": {
        "serverURL": "https://lic.staging.drmtoday.com/license-proxy-headerauth/drmtoday/RightsManager.asmx",
        "servertype" : "drmtoday",
        "httpRequestHeaders": {
            "http-header-CustomData": "eyJ1c2VySWQiOiIxMjM0NSIsInNlc3Npb25JZCI6ImV3b2dJQ0p3Y205bWFXeGxJaUE2SUhzS0lDQWdJQ0p3ZFhKamFHRnpaU0lnT2lCN0lIMEtJQ0I5TEFvZ0lDSnZkWFJ3ZFhSUWNtOTBaV04wYVc5dUlpQTZJSHNLSUNBZ0lDSmthV2RwZEdGc0lpQTZJR1poYkhObExBb2dJQ0FnSW1GdVlXeHZaM1ZsSWlBNklHWmhiSE5sTEFvZ0lDQWdJbVZ1Wm05eVkyVWlJRG9nWm1Gc2MyVUtJQ0I5TEFvZ0lDSnpkRzl5WlV4cFkyVnVjMlVpSURvZ1ptRnNjMlVLZlFvSyIsIm1lcmNoYW50IjoiY2FibGVsYWJzIn0K"
        }
    }
};

function MessageHandler( keysystem, content, sessionType ) {
    this._keysystem = keysystem;
    this._content = content;
    this._sessionType = sessionType || "temporary";
    this._drmconfig = drmconfig[ this._keysystem ];
    
    this.messagehandler = MessageHandler.prototype.messagehandler.bind( this );
    if ( this._drmconfig && this._drmconfig.servercertificate ) {
        this.servercertificate = stringToUint8Array( atob( this._drmconfig.servercertificate ) );
    }
}

MessageHandler.prototype.messagehandler = function messagehandler( messageType, message) {

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
    
    const serverTypes = {
        'drmtoday': {
            constructLicenseRequestUrl : function( serverURL, sessionType, content ) {
                return serverURL;
            }
        },
        'microsoft': {
            constructLicenseRequestUrl : function( serverURL, sessionType, content ) {
                var url = serverURL + "?";
                if ( sessionType === 'temporary' || sessionType === 'persistent-usage-record' ) {
                    url += "UseSimpleNonPersistentLicense=1&";
                }
                if ( sessionType === 'persistent-usage-record' ) {
                    url += "SecureStop=1&";
                }
                url += "ContentKey=" + btoa(String.fromCharCode.apply(null, content.keys[0].key));
                return url;
            }
        }
    };

    return new Promise(function(resolve, reject) {

        var keysystemfns = keySystems[this._keysystem],
            serverfns,
            url = undefined,
            requestheaders = {},
            credentials = undefined;
        
        if ( !this._drmconfig || !keysystemfns || !this._drmconfig.servertype || !serverTypes[this._drmconfig.servertype] ) {
            reject('Unsupported Key System');
            return;
        }
        
        serverfns = serverTypes[this._drmconfig.servertype];
        
        if ( !this._drmconfig.serverURL ) {
            reject('Undefined serverURL');
            return;
        }
        
        url = serverfns.constructLicenseRequestUrl( this._drmconfig.serverURL, this._sessionType, this._content );

        // Ensure valid license server URL
        if (!url) {
            reject('No license server URL specified!');
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
                    requestheaders[key] = headers[key];
                }
            }
        };

        updateHeaders(this._drmconfig.httpRequestHeaders);
        updateHeaders(keysystemfns.getRequestHeadersFromMessage(message));

        // Set withCredentials property from server
        if ( this._drmconfig.withCredentials ) {
            credentials = 'include';
        }

        fetch(url, {
            method: 'POST',
            headers: requestheaders,
            credentials: credentials,
            body: keysystemfns.getLicenseRequestFromMessage(message)
        }).then(function(fetchresponse) {
            if(fetchresponse.status !== 200) {
                reject( this._keysystem + ' update, XHR status is "' + fetchresponse.statusText
                            + '" (' + fetchresponse.status + '), expected to be 200. readyState is ' + fetchresponse.readyState + '.'
                            + ' Response is ' + ((fetchresponse) ? keysystemfns.getErrorResponse(fetchresponse) : 'NONE' ));
                return;
            }
            
            if(keysystemfns.responseType === 'json') {
                return fetchresponse.json();
            } else if(keysystemfns.responseType === 'arraybuffer') {
                return fetchresponse.arrayBuffer();
            }
        }.bind( this )).then(function(response){
            resolve(keysystemfns.getLicenseMessage(response));
        }).catch(reject);
    }.bind( this ));
};
