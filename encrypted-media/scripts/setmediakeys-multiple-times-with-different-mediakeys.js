function runTest(config) {
    var testname = config.keysystem + ', setmediakeys multiple times with different mediakeys';

    var configuration = getSimpleConfigurationForContent( config.content );

    if ( config.initDataType && config.initData ) {
        configuration.initDataTypes = [ config.initDataType ];
    }

    async_test (function (test) {
        var _video = config.video,
            _access,
            _mediaKeys1,
            _mediaKeys2;

        // Test MediaKeys assignment.
        assert_equals(_video.mediaKeys, null);
        assert_equals(typeof _video.setMediaKeys, 'function');

        navigator.requestMediaKeySystemAccess(config.keysystem, [configuration]).then(function(access) {
            _access = access;
            return _access.createMediaKeys();
        }).then(function(result) {
            _mediaKeys1 = result;
            assert_not_equals(_mediaKeys1, null);
            // Create a second mediaKeys.
            return _access.createMediaKeys();
        }).then(function(result) {
            _mediaKeys2 = result;
            assert_not_equals(_mediaKeys2, null);
            // Set _mediaKeys1 on video.
            return _video.setMediaKeys(_mediaKeys1);
        }).then(function() {
            assert_true(_video.mediaKeys === _mediaKeys1);
            // Set _mediaKeys2 on video (switching MediaKeys).
            return _video.setMediaKeys(_mediaKeys2);
        }).then(function() {
            assert_true(_video.mediaKeys === _mediaKeys2);
            // Clear mediaKeys from video.
            return _video.setMediaKeys(null);
        }).then(function() {
            assert_equals(_video.mediaKeys, null);
            // Set _mediaKeys1 on video again.
            return _video.setMediaKeys(_mediaKeys1);
        }).then(function() {
            assert_true(_video.mediaKeys === _mediaKeys1);
            return testmediasource(config);
        }).then(function(source) {
            // Load the media element to create the WebMediaPlayer.
            _video.src = URL.createObjectURL(source);
            // Set mediaKeys2 on video (switching MediaKeys) not
            // supported after WebMediaPlayer is created.
            return _video.setMediaKeys(_mediaKeys2);
        }).then(function() {
            assert_unreached('Switching mediaKeys after setting src should have failed.');
        }, function(error) {
            assert_true(_video.mediaKeys === _mediaKeys1);
            assert_equals(error.name, 'InvalidStateError');
            assert_not_equals(error.message, '');
            // Return something so the promise resolves properly.
            return Promise.resolve();
        }).then(function() {
            // Set null mediaKeys on video (clearing MediaKeys) not
            // supported after WebMediaPlayer is created.
            return _video.setMediaKeys(null);
        }).then(function() {
            assert_unreached('Clearing mediaKeys after setting src should have failed.');
        }, function(error) {
            assert_true(_video.mediaKeys === _mediaKeys1);
            assert_equals(error.name, 'InvalidStateError');
            assert_not_equals(error.message, '');
            test.done();
        }).catch(function(error) {
            forceTestFailureFromPromise(test, error);
        });
    }, testname);
}