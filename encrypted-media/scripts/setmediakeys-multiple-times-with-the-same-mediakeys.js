function runTest(config) {
    var testname = config.keysystem + ', setmediakeys multiple times with the same mediakeys';

    var configuration = getSimpleConfigurationForContent( config.content );

    if ( config.initDataType && config.initData ) {
        configuration.initDataTypes = [ config.initDataType ];
    }

    async_test (function (test) {
        var _video = config.video,
            _mediaKeys;

        // Test MediaKeys assignment.
        assert_equals(_video.mediaKeys, null);
        assert_equals(typeof _video.setMediaKeys, 'function');

        navigator.requestMediaKeySystemAccess(config.keysystem, [configuration]).then(function(access) {
            return access.createMediaKeys();
        }).then(function(result) {
            _mediaKeys = result;
            // Set mediaKeys for first time on video should work.
            return _video.setMediaKeys(_mediaKeys);
        }).then(function(result) {
            assert_true(_video.mediaKeys === _mediaKeys);
            // Set mediaKeys on video again should return a resolved promise.
            return _video.setMediaKeys(_mediaKeys);
        }).then(function (result) {
            assert_true(_video.mediaKeys === _mediaKeys);
            return testmediasource(config);
        }).then(function(source) {
            // Load the media element to create the WebMediaPlayer.
            _video.src = URL.createObjectURL(source);
            // Set mediaKeys again on video should still return a resolved promise.
            return _video.setMediaKeys(_mediaKeys);
        }).then(function() {
            assert_true(_video.mediaKeys === _mediaKeys);
            test.done();
        }).catch(function(error) {
            forceTestFailureFromPromise(test, error);
        });
    }, testname);
}