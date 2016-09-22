function runTest(config, qualifier) {
    var testname = testnamePrefix(qualifier, config.keysystem) + ' test MediaKeySession closed event.';

    var configuration = {   initDataTypes: [ config.initDataType ],
        audioCapabilities: [ { contentType: config.audioType } ],
        videoCapabilities: [ { contentType: config.videoType } ],
        sessionTypes: [ 'temporary' ] };

    async_test(function (test) {
        var initDataType;
        var initData;
        var mediaKeySession;
        navigator.requestMediaKeySystemAccess(config.keysystem, [configuration]).then(function (access) {
            initDataType = access.getConfiguration().initDataTypes[0];
            return access.createMediaKeys();
        }).then(function (mediaKeys) {
            mediaKeySession = mediaKeys.createSession();
            if(config.initData){
                initData = config.initData;
            }else{
                initData = stringToUint8Array(atob(config.content.keys[0].initData));
            }
            return mediaKeySession.generateRequest(initDataType, initData);
        }).then(function(){
            // Wait for the session to be closed.
            mediaKeySession.closed.then(function(result) {
                assert_equals(result, undefined);
                // Now that the session is closed, verify that the
                // closed attribute immediately returns a fulfilled
                // promise.
                return mediaKeySession.closed;
            }).then(function(result) {
                assert_equals(result, undefined);
                test.done();
            });

            // release() should result in the closed promise being
            // fulfilled.
            return mediaKeySession.close();
        }).catch(function(error) {
            forceTestFailureFromPromise(test, error);
        });
    }, testname);
}
