function getInitData(initDataType) {

    // FIXME: This is messed up, because here we are hard coding the key ids for the different content
    //        that we use for clearkey testing: webm and mp4. For keyids we return the mp4 one
    //
    //        The content used with the DRM today servers has a different key id altogether

    if (initDataType == 'webm') {
      return new Uint8Array([
          0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
          0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F
      ]);
    }

    if (initDataType == 'cenc') {
        return new Uint8Array([
            0x00, 0x00, 0x00, 0x34,   // size
            0x70, 0x73, 0x73, 0x68, // 'pssh'
            0x01, // version = 1
            0x00, 0x00, 0x00, // flags
            0x10, 0x77, 0xEF, 0xEC, 0xC0, 0xB2, 0x4D, 0x02, // Common SystemID
            0xAC, 0xE3, 0x3C, 0x1E, 0x52, 0xE2, 0xFB, 0x4B,
            0x00, 0x00, 0x00, 0x01, // key count
            0x00, 0x00, 0x00, 0x00, 0x03, 0xd2, 0xfc, 0x41, // key id
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00 // datasize
        ]);
    }
    if (initDataType == 'keyids') {
        var keyId = new Uint8Array([
            0x00, 0x00, 0x00, 0x00, 0x03, 0xd2, 0xfc, 0x41,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        return stringToUint8Array(createKeyIDs(keyId));
    }
    throw 'initDataType ' + initDataType + ' not supported.';
}

function stringToUint8Array(str)
{
    var result = new Uint8Array(str.length);
    for(var i = 0; i < str.length; i++) {
        result[i] = str.charCodeAt(i);
    }
    return result;
}
// Encodes |data| into base64url string. There is no '=' padding, and the
// characters '-' and '_' must be used instead of '+' and '/', respectively.
function base64urlEncode(data) {
    var result = btoa(String.fromCharCode.apply(null, data));
    return result.replace(/=+$/g, '').replace(/\+/g, "-").replace(/\//g, "_");
}
// Decode |encoded| using base64url decoding.
function base64urlDecode(encoded) {
    return atob(encoded.replace(/\-/g, "+").replace(/\_/g, "/"));
}
// Decode |encoded| using base64 to a Uint8Array
function base64DecodeToUnit8Array(encoded) {
    return new Uint8Array( atob( encoded ).split('').map( function(c){return c.charCodeAt(0);} ) );
}
// Clear Key can also support Key IDs Initialization Data.
// ref: http://w3c.github.io/encrypted-media/keyids-format.html
// Each parameter is expected to be a key id in an Uint8Array.
function createKeyIDs() {
    var keyIds = '{"kids":["';
    for (var i = 0; i < arguments.length; i++) {
        if (i != 0) keyIds += '","';
        keyIds += base64urlEncode(arguments[i]);
    }
    keyIds += '"]}';
    return keyIds;
}

function getSupportedKeySystem() {
    var userAgent = navigator.userAgent.toLowerCase();
    var keysystem = undefined;
    if(userAgent.indexOf('edge') > -1) {
        keysystem = 'com.microsoft.playready';
    } else if(/CrKey\/[0-9]+\.[0-9a-z]+\.[0-9a-z]+/i.exec( navigator.userAgent )) {
        keysystem = 'com.chromecast.playready';
    } else if( userAgent.indexOf('chrome') > -1 || userAgent.indexOf('firefox') > -1 ) {
        keysystem = 'com.widevine.alpha';
    }
    return keysystem;
}

function getPlayreadyMeteringCert(server) {
    var playreadyMeteringCert = undefined;
    if(server.toLowerCase().indexOf('microsoft') > -1) {
        playreadyMeteringCert = "Q0hBSQAAAAEAAAUEAAAAAAAAAAJDRVJUAAAAAQAAAfQAAAFkAAEAAQAAAFjt9G6KdSncCkrjbTQPN+/2AAAAAAAAAAAAAAAJIPbrW9dj0qydQFIomYFHOwbhGZVGP2ZsPwcvjh+NFkP/////AAAAAAAAAAAAAAAAAAAAAAABAAoAAABYxw6TjIuUUmvdCcl00t4RBAAAADpodHRwOi8vcGxheXJlYWR5LmRpcmVjdHRhcHMubmV0L3ByL3N2Yy9yaWdodHNtYW5hZ2VyLmFzbXgAAAAAAQAFAAAADAAAAAAAAQAGAAAAXAAAAAEAAQIAAAAAADBRmRRpqV4cfRLcWz9WoXIGZ5qzD9xxJe0CSI2mXJQdPHEFZltrTkZtdmurwVaEI2etJY0OesCeOCzCqmEtTkcAAAABAAAAAgAAAAcAAAA8AAAAAAAAAAVEVEFQAAAAAAAAABVNZXRlcmluZyBDZXJ0aWZpY2F0ZQAAAAAAAAABAAAAAAABAAgAAACQAAEAQGHic/IPbmLCKXxc/MH20X/RtjhXH4jfowBWsQE1QWgUUBPFId7HH65YuQJ5fxbQJCT6Hw0iHqKzaTkefrhIpOoAAAIAW+uRUsdaChtq/AMUI4qPlK2Bi4bwOyjJcSQWz16LAFfwibn5yHVDEgNA4cQ9lt3kS4drx7pCC+FR/YLlHBAV7ENFUlQAAAABAAAC/AAAAmwAAQABAAAAWMk5Z0ovo2X0b2C9K5PbFX8AAAAAAAAAAAAAAARTYd1EkpFovPAZUjOj2doDLnHiRSfYc89Fs7gosBfar/////8AAAAAAAAAAAAAAAAAAAAAAAEABQAAAAwAAAAAAAEABgAAAGAAAAABAAECAAAAAABb65FSx1oKG2r8AxQjio+UrYGLhvA7KMlxJBbPXosAV/CJufnIdUMSA0DhxD2W3eRLh2vHukIL4VH9guUcEBXsAAAAAgAAAAEAAAAMAAAABwAAAZgAAAAAAAAAgE1pY3Jvc29mdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgFBsYXlSZWFkeSBTTDAgTWV0ZXJpbmcgUm9vdCBDQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgDEuMC4wLjEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEACAAAAJAAAQBArAKJsEIDWNG5ulOgLvSUb8I2zZ0c5lZGYvpIO56Z0UNk/uC4Mq3jwXQUUN6m/48V5J/vuLDhWu740aRQc1dDDAAAAgCGTWHP8iVuQixWizwoABz7PhUnZYWEugUht5sYKNk23h2Cao/D5uf6epDVyilG8fZKLvufXc/+fkNOtEKT+sWr";
    } else if(server.toLowerCase().indexOf('drmtoday')) {
        // Add DRMToday cert here
    }
    return playreadyMeteringCert;
}

function waitForEventAndRunStep(eventName, element, func, stepTest)
{
    var eventCallback = function(event) {
        if (func)
            func(event);
    }

    element.addEventListener(eventName, stepTest.step_func(eventCallback), true);
}

var consoleDiv = null;

function consoleWrite(text)
{
    if (!consoleDiv && document.body) {
        consoleDiv = document.createElement('div');
        document.body.appendChild(consoleDiv);
    }
    var span = document.createElement('span');
    span.appendChild(document.createTextNode(text));
    span.appendChild(document.createElement('br'));
    consoleDiv.appendChild(span);
}

function forceTestFailureFromPromise(test, error, message)
{
    // Promises convert exceptions into rejected Promises. Since there is
    // currently no way to report a failed test in the test harness, errors
    // are reported using force_timeout().
    if (message)
        consoleWrite(message + ': ' + error.message);
    else if (error)
        consoleWrite(error);

    test.force_timeout();
    test.done();
}

// Returns an array of audioCapabilities that includes entries for a set of
// codecs that should cover all user agents.
function getPossibleAudioCapabilities()
{
    return [
        { contentType: 'audio/mp4; codecs="mp4a.40.2"' },
        { contentType: 'audio/webm; codecs="opus"' },
    ];
}

// Returns a trivial MediaKeySystemConfiguration that should be accepted,
// possibly as a subset of the specified capabilities, by all user agents.
function getSimpleConfiguration()
{
    return [ {
        initDataTypes : [ 'webm', 'cenc', 'keyids' ],
        audioCapabilities: getPossibleAudioCapabilities()
    } ];
}

// Returns a MediaKeySystemConfiguration for |initDataType| that should be
// accepted, possibly as a subset of the specified capabilities, by all
// user agents.
function getSimpleConfigurationForInitDataType(initDataType)
{
    return [ {
        initDataTypes: [ initDataType ],
        audioCapabilities: getPossibleAudioCapabilities()
    } ];
}

// Returns a promise that is fulfilled with true if |initDataType| is supported,
// by keysystem or false if not.
function isInitDataTypeSupported(keysystem,initDataType)
{
    return navigator.requestMediaKeySystemAccess(
                        keysystem, getSimpleConfigurationForInitDataType(initDataType))
        .then(function() { return true; }, function() { return false; });
}

function getSupportedInitDataTypes( keysystem )
{
    return [ 'cenc', 'keyids', 'webm' ].filter( isInitDataTypeSupported.bind( null, keysystem ) );
}

function arrayBufferAsString(buffer)
{
    var array = [];
    Array.prototype.push.apply( array, new Uint8Array( buffer ) );
    return '0x' + array.map( function( x ) { return x < 16 ? '0'+x.toString(16) : x.toString(16); } ).join('');
}

function dumpKeyStatuses(keyStatuses)
{
    consoleWrite("for (var entry of keyStatuses)");
    for (var entry of keyStatuses) {
        consoleWrite(arrayBufferAsString(entry[0]) + ": " + entry[1]);
    }
    consoleWrite("for (var keyId of keyStatuses.keys())");
    for (var keyId of keyStatuses.keys()) {
        consoleWrite(arrayBufferAsString(keyId));
    }
    consoleWrite("for (var status of keyStatuses.values())");
    for (var status of keyStatuses.values()) {
        consoleWrite(status);
    }
    consoleWrite("for (var entry of keyStatuses.entries())");
    for (var entry of keyStatuses.entries()) {
        consoleWrite(arrayBufferAsString(entry[0]) + ": " + entry[1]);
    }
    consoleWrite("keyStatuses.forEach()");
    keyStatuses.forEach(function(status, keyId) {
        consoleWrite(arrayBufferAsString(keyId) + ": " + status);
    });
}

// Verify that |keyStatuses| contains just the keys in |keys.expected|
// and none of the keys in |keys.unexpected|. All keys should have status
// 'usable'. Example call: verifyKeyStatuses(mediaKeySession.keyStatuses,
// { expected: [key1], unexpected: [key2] });
function verifyKeyStatuses(keyStatuses, keys)
{
    var expected = keys.expected || [];
    var unexpected = keys.unexpected || [];

    // |keyStatuses| should have same size as number of |keys.expected|.
    assert_equals(keyStatuses.size, expected.length);

    // All |keys.expected| should be found.
    expected.map(function(key) {
        assert_true(keyStatuses.has(key));
        assert_equals(keyStatuses.get(key), 'usable');
    });

    // All |keys.unexpected| should not be found.
    unexpected.map(function(key) {
        assert_false(keyStatuses.has(key));
        assert_equals(keyStatuses.get(key), undefined);
    });
}


