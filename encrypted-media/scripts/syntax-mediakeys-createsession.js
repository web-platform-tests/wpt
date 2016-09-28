function runTest(config) {
    setup({explicit_done: true});
    var keysystem = config.keysystem;
    var testname  = testnamePrefix(null, config.keysystem);
    var allTestPromises = []; // used to verify that all tests are complete before done() is called
    var configuration = {
        initDataTypes: [config.initDataType],
        audioCapabilities: [{contentType: config.audioType}],
        videoCapabilities: [{contentType: config.videoType}],
        sessionTypes: ['temporary']
    };

    var kCreateSessionExceptionsTestCases = [
        // Tests in this set use a shortened parameter name due to
        // format_value() only returning the first 60 characters as the
        // result. With a longer name the first 60 characters is not
        // enough to determine which test failed.

        // Invalid parameters.
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.createSession();
            }
        },
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.createSession('');
            }
        },
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.createSession(null);
            }
        },
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.createSession(undefined);
            }
        },
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.createSession(1);
            }
        },
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.createSession(new Uint8Array(0));
            }
        },
        {
            exception: 'TypeError',
            func: function (mk) {
                return mk.createSession('TEMPORARY');
            }
        }
    ];

    // This function checks that calling createSession() with an
    // unsupported session type doesn't create a MediaKeySession object.
    // Since requestMediaKeySystemAccess() is called without specifying
    // persistent sessions, only temporary sessions will be allowed.
    function test_unsupported_sessionType(mediaKeys) {
        var mediaKeySession = 'test';
        try {
            mediaKeySession = mediaKeys.createSession('persistent-license');
            assert_unreached('Session should not be created.');
        } catch (error) {
            assert_equals(error.name, 'NotSupportedError');
            assert_not_equals(error.message, "");

            // Since createSession() failed, |mediaKeySession| is not
            // touched.
            assert_equals(mediaKeySession, 'test');
        }
    };
    var testPromise1 = new Promise(function (resolve) {
        async_test(function (test) {
            try{
                navigator.requestMediaKeySystemAccess(keysystem, [configuration])
                    .then(function (access) {
                        return access.createMediaKeys();
                    })
                    .then(function (mediaKeys) {
                        // Just call every func in kCreateSessionExceptionsTestCases
                        kCreateSessionExceptionsTestCases.map(function (testCase) {
                            try{
                                testCase.func();
                                test.step(function(){
                                    assert_unreached();
                                })

                            }catch(error){
                                test.step(function(){
                                    assert_equals(error.name, testCase.exception, format_value(testCase.func));
                                    assert_not_equals(error.message, "", format_value(testCase.func));
                                })
                            }
                        });
                        test.step(test_unsupported_sessionType.bind(test,mediaKeys))
                        test.done();
                        resolve();
                    })
            }catch(e){
                test.step(function(){
                    assert_unreached(e.message);
                });
                test.done()
                resolve()
            };
        }, testname + ' test MediaKeys createSession() exceptions.');
    });
    allTestPromises.push(testPromise1);
    // All calls to |func| in this group are supposed to succeed.
    // However, the spec notes that some things are optional for
    // Clear Key. In particular, support for persistent sessions
    // is optional. Since some implementations won't support some
    // features, a NotSupportedError is treated as a success
    // if |isNotSupportedAllowed| is true.
    var kCreateSessionTestCases = [
        // Use the default sessionType.
        {
            func: function (mk) {
                return mk.createSession();
            },
            isNotSupportedAllowed: false,
            testCaseName: "createSession()"
        },
        // Try variations of sessionType.
        {
            func: function (mk) {
                return mk.createSession('temporary');
            },
            isNotSupportedAllowed: false,
            testCaseName: "createSession('temporary')"
        },
        {
            func: function (mk) {
                return mk.createSession(undefined);
            },
            isNotSupportedAllowed: false,
            testCaseName: "createSession(undefined)"
        },
        {
            // Since this is optional, some Clear Key implementations
            // will succeed, others will return a "NotSupportedError".
            // Both are allowed results.
            func: function (mk) {
                return mk.createSession('persistent-license');
            },
            isNotSupportedAllowed: true,
            testCaseName: "createSession('persistent-license')"
        },
        // Try additional parameter, which should be ignored.
        {
            func: function (mk) {
                return mk.createSession('temporary', 'extra');
            },
            isNotSupportedAllowed: false,
            testCaseName: "createSession('temporary', 'extra')"
        }
    ];

    // These tests check that calling |testCase.func| creates a
    // MediaKeySession object with some default values. They also
    // allow NotSupportedErrors to be generated and treated as a
    // success, if allowed. See comment above kCreateSessionTestCases.
    var testPromise2 = new Promise(function (resolve) {
        try {
            navigator.requestMediaKeySystemAccess(keysystem, [configuration])
                .then(function (access) {
                    return access.createMediaKeys();
                })
                .then(function (mediaKeys) {
                    runCreateSessionTests(null, mediaKeys)
                    resolve();
                }
            );
        } catch (e) {
            runCreateSessionTests(e);
            resolve()
        }
    });
    allTestPromises.push(testPromise2);
    // Fail if there is an error that is not allowed in this testcase
    function failIfError(error, isAllowed){
        if(error && !isAllowed){
            assert_true(false, error.message)
        }
    }
    /**
     * @param err let all tests fail with this error
     * @param mediaKeys
     */
    function runCreateSessionTests(err, mediaKeys) {
        kCreateSessionTestCases.map(function (testCase, index) {

                var mediaKeySession = undefined;
                var createSessionErrored;
                var requestAccessError = err;
                try {
                    mediaKeySession = testCase.func.call(null, mediaKeys);
                } catch (e) {
                    if(!err){
                        createSessionErrored = e;
                    }
                }
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(typeof mediaKeySession, 'object');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }

                }, testname + " " + testCase.testCaseName + " mediaKeySession is of type object");
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(typeof mediaKeySession.addEventListener, 'function');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }
                }, testname + " " + testCase.testCaseName + " mediaKeySession.addEventListener is of type function");
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(typeof mediaKeySession.expiration, 'number');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }
                }, testname + " " + testCase.testCaseName + " mediaKeySession.expiration is of type number");
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(typeof mediaKeySession.closed, 'object');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }
                }, testname + " " + testCase.testCaseName + " mediaKeySession.closed is of type object");
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(typeof mediaKeySession.keyStatuses, 'object');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }
                }, testname + " " + testCase.testCaseName + " mediaKeySession.keyStatuses is of type object");
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(typeof mediaKeySession.onkeystatuseschange, 'object');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }
                }, testname + " " + testCase.testCaseName + " mediaKeySession.onkeystatuseschange is of type object");
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(typeof mediaKeySession.onmessage, 'object');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }
                }, testname + " " + testCase.testCaseName + " mediaKeySession.onmessage is of type object");
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(typeof mediaKeySession.generateRequest, 'function');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }
                }, testname + " " + testCase.testCaseName + " mediaKeySession.generateRequest is of type function");
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(typeof mediaKeySession.load, 'function');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }
                }, testname + " " + testCase.testCaseName + " mediaKeySession.load is of type function");
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(typeof mediaKeySession.update, 'function');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }
                }, testname + " " + testCase.testCaseName + " mediaKeySession.update is of type function");
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(typeof mediaKeySession.close, 'function');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }
                }, testname + " " + testCase.testCaseName + " mediaKeySession.close is of type function");
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(typeof mediaKeySession.remove, 'function');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }
                }, testname + " " + testCase.testCaseName + " mediaKeySession.remove is of type function");
                test(function (test) {
                    failIfError(requestAccessError, false);
                    try {
                        assert_equals(mediaKeySession.sessionId, '');
                    } catch (e) {
                        assert_true(testCase.isNotSupportedAllowed);
                        failIfError(createSessionErrored, testCase.isNotSupportedAllowed);
                    }
                }, testname + " " + testCase.testCaseName + " mediaKeySession.sessionId is ''");
            }
        );
    }
    // When all test promises resolved call done() to start evaluation
    Promise.all(allTestPromises).then(function () {
            done()
        }
    );
}