// This test is only applicable to clearkey
function runTest(config, qualifier) {
    var testname = testnamePrefix(qualifier, config.keysystem) + ' test handling of non-ASCII responses for update()';

    var configuration = getSimpleConfigurationForContent(config.content);

    if (config.initDataType && config.initData) configuration.initDataTypes = [config.initDataType];

    async_test(function (test) {
        var initDataType;
        var initData;
        var mediaKeySession;

        // Clear Key JSON Web Key needs to be Ascii encoded
        function processMessage(event) {
                // |jwkSet| contains a  non-ASCII character \uDC00.
                var jwkSet = '{"keys":[{'
                    +     '"kty":"oct",'
                    +     '"k":"MDEyMzQ1Njc4OTAxMjM0NQ",'
                    +     '"kid":"MDEyMzQ1Njc4O\uDC00TAxMjM0NQ"'
                    + '}]}';


                event.target.update(stringToUint8Array(jwkSet)).then(function () {
                    forceTestFailureFromPromise(test, 'Error: update() succeeded');
                }, function (error) {
                    assert_equals(error.name, 'InvalidAccessError');
                    test.done();
                });
        }

        navigator.requestMediaKeySystemAccess(config.keysystem, [configuration]).then(function (access) {
            initDataType = access.getConfiguration().initDataTypes[0];
            initData = getInitData(config.content, initDataType);
            return access.createMediaKeys();
        }).then(function (mediaKeys) {
            mediaKeySession = mediaKeys.createSession();
            waitForEventAndRunStep('message', mediaKeySession, processMessage, test);
            return mediaKeySession.generateRequest(initDataType, initData);
        })
    }, testname);
}
