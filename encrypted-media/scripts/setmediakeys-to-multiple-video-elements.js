function runTest(config) {
    var testname = config.keysystem + ', setMediaKeys to multiple video elements';

    var configuration = getSimpleConfigurationForContent( config.content );

    if ( config.initDataType && config.initData ) {
        configuration.initDataTypes = [ config.initDataType ];
    }

    async_test (function (test) {
        var _video1 = config.video1,
            _video2 = config.video2,
            _mediaKeys;


        navigator.requestMediaKeySystemAccess(config.keysystem, [configuration]).then(function(access) {
            assert_equals(access.keySystem, config.keysystem)
            return access.createMediaKeys();
        }).then(function(result) {
            _mediaKeys = result;
            assert_not_equals(_mediaKeys, null);
            assert_equals(typeof _mediaKeys.createSession, 'function');
            return _video1.setMediaKeys(_mediaKeys);
        }).then(function(result) {
            assert_not_equals(_video1.mediaKeys, null);
            assert_true(_video1.mediaKeys === _mediaKeys);
            return _video2.setMediaKeys(_mediaKeys);
        }).then(function() {
            assert_unreached('Second setMediaKeys should have failed.');
        }, function(error) {
            assert_equals(error.name, 'QuotaExceededError');
            assert_not_equals(error.message, '');
            // Return something so the promise resolves properly.
            return Promise.resolve();
        }).then(function() {
            // Now clear it from video1.
            return _video1.setMediaKeys(null);
        }).then(function() {
            // Should be assignable to video2.
            return _video2.setMediaKeys(_mediaKeys);
        }).then(function(result) {
            assert_not_equals(_video2.mediaKeys, null);
            assert_true(_video2.mediaKeys === _mediaKeys);
            test.done();
        }).catch(function(error) {
            forceTestFailureFromPromise(test, error);
        });
    }, testname);
}