function runTest(config) {

    var testname = config.keysystem + ', successful playback, temporary, '
                                    + /video\/([^;]*)/.exec( config.videoType )[ 1 ]
                                    + ', waitingforkey event';

    var configuration = {   initDataTypes: [ config.initDataType ],
                            audioCapabilities: [ { contentType: config.audioType } ],
                            videoCapabilities: [ { contentType: config.videoType } ],
                            sessionTypes: [ 'temporary' ] };

    async_test( function( test ) {

        var _video = config.video,
            _mediaKeys,
            _mediaKeySessions = [ ],
            _mediaSource;

        function onMessage(event) {
            assert_any( assert_equals, event.target, _mediaKeySessions );
            assert_true( event instanceof window.MediaKeyMessageEvent );
            assert_equals( event.type, 'message');

            assert_any( assert_equals,
                        event.messageType,
                        [ 'license-request', 'individualization-request' ] );

            config.messagehandler( config.keysystem, event.messageType, event.message )
            .then( function( response ) {

                event.target.update( response )
                .catch(function(error) {
                    forceTestFailureFromPromise(test, error);
                });
            });
        }

        function onWaitingForKey(event) {

            // Not using waitForEventAndRunStep() to avoid too many
            // EVENT(onTimeUpdate) logs.
            _video.addEventListener('timeupdate', onTimeupdate, true);

            // Create sessions now if we do not have them
            if ( _mediaKeySessions.length === 0 ) {
                config.initData.forEach( function( initData ) {

                    var mediaKeySession = _mediaKeys.createSession( 'temporary' );

                    waitForEventAndRunStep('message', mediaKeySession, onMessage, test);

                    _mediaKeySessions.push( mediaKeySession );

                    mediaKeySession.generateRequest( config.initDataType, initData )
                    .catch(function(error) {
                        forceTestFailureFromPromise(test, error);
                    });
                } );
            }
        }

        function onTimeupdate(event) {
            if ( _video.currentTime > ( config.duration || 5 ) ) {

                _video.removeEventListener('timeupdate', onTimeupdate);
                _video.pause();
                test.done();
            }
        }

        navigator.requestMediaKeySystemAccess(config.keysystem, [ configuration ]).then(function(access) {
            return access.createMediaKeys();
        }).then(function(mediaKeys) {
            _mediaKeys = mediaKeys;

            _video.setMediaKeys(_mediaKeys);

            waitForEventAndRunStep('waitingforkey', _video, onWaitingForKey, test);

        }).then(function() {
            return testmediasource(config);
        }).then(function(source) {
            _mediaSource = source;
            _video.src = URL.createObjectURL(_mediaSource);
            _video.play();
        }).catch(function(error) {
            forceTestFailureFromPromise(test, error);
        });
    }, testname);
}
