function runTest(config, qualifier) {
    var testname = testnamePrefix( qualifier, config.keysystem )
                                     + ', setmediakeys again after resetting src';

    var configuration = getSimpleConfigurationForContent( config.content );

    if ( config.initDataType && config.initData ) {
        configuration.initDataTypes = [ config.initDataType ];
    }

    async_test (function (test) {
        var _video = config.video,
            _access,
            _mediaKeys,
            _mediaKeySession,
            _mediaSource;

        function onFailure(error) {
            forceTestFailureFromPromise(test, error);
        }

        function onMessage(event) {
            config.messagehandler( event.messageType, event.message ).then( function( response ) {
                _mediaKeySession.update( response ).catch(onFailure).then(function() {
                    _video.play();
                });
            });
        }

        function onEncrypted(event) {
            waitForEventAndRunStep('message', _mediaKeySession, onMessage, test);
            _mediaKeySession.generateRequest(   config.initData ? config.initDataType : event.initDataType,
                                                config.initData || event.initData )
            .catch(onFailure);
        }

        function playVideoAndWaitForTimeupdate()
        {
            _mediaKeySession = _mediaKeys.createSession('temporary');
            waitForEventAndRunStep('encrypted', _video, onEncrypted, test);
            _video.src = URL.createObjectURL(_mediaSource);
            return new Promise(function(resolve) {
                _video.addEventListener('timeupdate', function listener(event) {
                    if (event.target.currentTime < (config.duration || 1))
                        return;
                    _video.removeEventListener('timeupdate', listener);
                    resolve('success');
                });
            });
        }

        navigator.requestMediaKeySystemAccess(config.keysystem, [configuration]).then(function(access) {
            _access = access;
            return _access.createMediaKeys();
        }).then(function(result) {
            _mediaKeys = result;
            return _video.setMediaKeys(_mediaKeys);
        }).then(function() {
            return config.servercertificate ? _mediaKeys.setServerCertificate( config.servercertificate ) : true;
        }).then(function( success ) {
            return testmediasource(config);
        }).then(function(source) {
            _mediaSource = source;
            return playVideoAndWaitForTimeupdate();
        }).then(function(results) {
            return _access.createMediaKeys();
        }).then(function(result) {
            _mediaKeys = result;
            _video.src = '';
            return _video.setMediaKeys(_mediaKeys);
        }).then(function() {
            return config.servercertificate ? _mediaKeys.setServerCertificate( config.servercertificate ) : true;
        }).then(function( success ) {
            return playVideoAndWaitForTimeupdate();
        }).then(function() {
            test.done();
        }).catch(onFailure);
    }, testname);
}