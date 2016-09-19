function runTest(config,qualifier) {

    // config.initData contains a list of keys. We expect those to be needed in order and get
    // one waitingforkey event for each one.

    var testname = testnamePrefix( qualifier, config.keysystem )
                                    + ', successful playback, temporary, '
                                    + /video\/([^;]*)/.exec( config.videoType )[ 1 ]
                                    + ', multiple keys, sequential';

    var configuration = {   initDataTypes: [ config.initDataType ],
                            audioCapabilities: [ { contentType: config.audioType } ],
                            videoCapabilities: [ { contentType: config.videoType } ],
                            sessionTypes: [ 'temporary' ] };

    async_test( function( test ) {

        var _video = config.video,
            _mediaKeys,
            _mediaKeySessions = [ ],
            _mediaSource,
            _playbackStarted = false;
            
        function dumpTimeRanges( ranges ) {
            for( var i=0; i < ranges.length; ++i ) {
                consoleWrite( ranges.start( i ) + "-" + ranges.end( i ) );
            }
        }
        
        function startNewSession() {
            assert_less_than( _mediaKeySessions.length, config.initData.length );
            var mediaKeySession = _mediaKeys.createSession( 'temporary' );
            waitForEventAndRunStep('message', mediaKeySession, onMessage, test);
            _mediaKeySessions.push( mediaKeySession );
            mediaKeySession.generateRequest( config.initDataType, config.initData[ _mediaKeySessions.length - 1 ] ).catch(onFailure);
        }

        function onFailure( error ) {
            forceTestFailureFromPromise(test, error);
        }

        function onMessage(event) {
            consoleWrite("message");
            config.messagehandler( event.messageType, event.message ).then( function( response ) {
                event.target.update( response ).then( function() {
                    dumpKeyStatuses(event.target.keyStatuses);
                }).catch(onFailure);
            });
        }

        function onEncrypted(event) {
            consoleWrite("encrypted");
        }

        function onWaitingForKey(event) {
            consoleWrite("waitingforkey");
        }
        
        function onPlaying(event) {
            consoleWrite("playing");
            assert_equals( _mediaKeySessions.length, 1, "Playback should start with a single key / session" );
            
            consoleWrite("videoelement buffered");
            dumpTimeRanges(_video.buffered);
            consoleWrite("source[0] buffered");
            dumpTimeRanges( _mediaSource.sourceBuffers[ 0 ].buffered );
            consoleWrite("source[1] buffered");
            dumpTimeRanges( _mediaSource.sourceBuffers[ 1 ].buffered );
        }
        
        function onPause(event) {
            consoleWrite("pause");
        }
        
        function onWaiting(event) {
            consoleWrite("waiting");
        }
        
        function onStalled(event) {
            consoleWrite("stalled");
            
            // Fetch a new key each time the video stalls
            startNewSession();
        }

        function onTimeupdate(event) {
            consoleWrite("timeupdate: " + _video.currentTime );
            
            if ( _video.currentTime > ( config.duration || 6 ) ) {
                assert_equals( _mediaKeySessions.length, config.initData.length, "It should require all keys to reach end of content" );
                _video.pause();
                test.done();
            }
        }

        navigator.requestMediaKeySystemAccess(config.keysystem, [ configuration ]).then(function(access) {
            return access.createMediaKeys();
        }).then(function(mediaKeys) {
            _mediaKeys = mediaKeys;
            return _video.setMediaKeys(_mediaKeys);
        }).then(function(){
            // Not using waitForEventAndRunStep() to avoid too many
            // EVENT(onTimeUpdate) logs.
            _video.addEventListener('timeupdate', test.step_func( onTimeupdate ), true);
            
            waitForEventAndRunStep('encrypted', _video, onEncrypted, test);
            waitForEventAndRunStep('waitingforkey', _video, onWaitingForKey, test);
            waitForEventAndRunStep('playing', _video, onPlaying, test);
            waitForEventAndRunStep('pause', _video, onPause, test);
            waitForEventAndRunStep('waiting', _video, onWaiting, test);
            waitForEventAndRunStep('stalled', _video, onStalled, test);
            
            startNewSession();

            return testmediasource(config);
        }).then(function(source) {
            _mediaSource = source;
            _video.src = URL.createObjectURL(_mediaSource);
            _video.play();
        }).catch(onFailure);
    }, testname);
}
