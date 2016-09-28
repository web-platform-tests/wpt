function runTest(config) {
    var keysystem = config.keysystem;
    var testname  = testnamePrefix(null, config.keysystem);
    var configuration = {
        initDataTypes: [config.initDataType],
        audioCapabilities: [{contentType: config.audioType}],
        videoCapabilities: [{contentType: config.videoType}],
        sessionTypes: ['temporary']
    };
    // Since promises catch any exception and convert it into a
    // rejected Promise, there is no current way to have the W3C
    // test framework report a failed test. For now, simply force
    // a timeout to indicate failure.
    // FIXME: Once W3C test framework handles Promises, fix this.
    // This function checks that calling |testCase.func| returns a
    // rejected Promise with the error.name equal to
    // |testCase.exception|.
    function test_exception(testCase /*...*/) {
        var func = testCase.func;
        var exception = testCase.exception;
        var args = Array.prototype.slice.call(arguments, 1);

        // Currently blink throws for TypeErrors rather than returning
        // a rejected promise (http://crbug.com/359386).
        // FIXME: Remove try/catch once they become failed promises.
        try {
            return func.apply(null, args).then(
                function (result) {
                    assert_unreached(format_value(func));
                },
                function (error) {
                    assert_equals(error.name, exception, format_value(func));
                    assert_not_equals(error.message, "", format_value(func));
                }
            );
        } catch (e) {
            // Only allow 'TypeError' exceptions to be thrown.
            // Everything else should be a failed promise.
            assert_equals('TypeError', exception, format_value(func));
            assert_equals(e.name, exception, format_value(func));
        }
    }

    var kSetServerCertificateExceptionsTestCases = [
        // Too few parameters.
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.setServerCertificate();
            }
        },
        // Invalid parameters.
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.setServerCertificate('');
            }
        },
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.setServerCertificate(null);
            }
        },
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.setServerCertificate(undefined);
            }
        },
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.setServerCertificate(1);
            }
        },
        // Empty array.
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.setServerCertificate(new Uint8Array(0));
            }
        }
    ];

    async_test(function (test) {
        navigator.requestMediaKeySystemAccess(keysystem, [configuration])
            .then(function (access) {
                return access.createMediaKeys();
            })
            .then(function (mediaKeys) {
                var promises = kSetServerCertificateExceptionsTestCases.map(function (testCase) {
                    return test_exception(testCase, mediaKeys);
                });
                assert_not_equals(promises.length, 0);
                return Promise.all(promises);
            })
            .then(function (result) {
                test.done();
            })
            .catch(function (error) {
                forceTestFailureFromPromise(test, error, 'setServerCertificate() exception tests failed');
            });
    }, testname + ' test MediaKeys setServerCertificate() exceptions.');


    // All calls to |func| in this group resolve. setServerCertificate with these cert may either resolve with true
    // for clearkey or throw a DOMException.
    var kSetServerCertificateTestCases = [
        {
            // Pass in ArrayBufferView
            func: function (mk) {
                var cert = new Uint8Array(200);
                assert_true(ArrayBuffer.isView(cert));

                return new Promise(function (resolve, reject) {
                    mk.setServerCertificate(cert).then(function (value) {
                        resolve(value);
                    }).catch(function (error) {
                        if (Object.prototype.toString.call(error) === "[object DOMException]") {
                            resolve(false);
                        }
                        ;
                    });
                })
            },
            expected: false
        },
        {
            // Pass in ArrayBuffer.
            func: function (mk) {
                var cert = new ArrayBuffer(200);
                assert_false(ArrayBuffer.isView(cert));
                return new Promise(function (resolve) {
                    mk.setServerCertificate(cert).then(function (resolveValue) {
                        resolve(resolveValue);
                    }).catch(function (error) {
                        if (Object.prototype.toString.call(error) === "[object DOMException]") {
                            resolve(false);
                        }
                        ;
                    });
                })
            },
            expected: false
        }
    ];

    async_test(function (test) {
        var expected_result;
        navigator.requestMediaKeySystemAccess(keysystem, [configuration])
            .then(function (access) {
                return access.createMediaKeys();
            })
            .then(function (mediaKeys) {
                var promises = kSetServerCertificateTestCases.map(function (testCase) {
                    return testCase.func.call(null, mediaKeys);
                });
                expected_result = kSetServerCertificateTestCases.map(function (testCase) {
                    return testCase.expected;
                });
                assert_not_equals(promises.length, 0);
                return Promise.all(promises);
            })
            .then(function (result) {
                assert_array_equals(result, expected_result);
                test.done();
            })
            .catch(function (error) {
                forceTestFailureFromPromise(test, error, 'setServerCertificate() test failed');
            });
    }, testname + ' test MediaKeys setServerCertificate() syntax with non-empty cert.');
}