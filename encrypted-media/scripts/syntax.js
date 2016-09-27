function runTest(config) {
    var keysystem = config.keysystem;
    var initData = config.initData;
    var initDataType = config.initDataType;
    var handler = config.handler;
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

    function wait_for_message_event(mediaKeySession, handler, test) {
        return new Promise(function (resolve) {
            mediaKeySession.addEventListener('message', function listener(e) {
                assert_equals(e.target, mediaKeySession);
                assert_equals(e.type, 'message');
                video.removeEventListener('message', listener);
                return handler(e.messageType, e.message)
                    .then(function (response) {
                        return e.target.update(response)
                    })
                    .then(function () {
                        resolve();
                    })
                    .catch(function (error) {
                        forceTestFailureFromPromise(test, error);
                    })
            });
        });
    }

    var kRequestMediaKeySystemAccessExceptionsTestCases = [
        // Too few parameters.
        {
            exception: 'TypeError',
            func: function () {
                return navigator.requestMediaKeySystemAccess();
            }
        },
        {
            exception: 'TypeError',
            func: function () {
                return navigator.requestMediaKeySystemAccess(keysystem);
            }
        },
        // Invalid key systems. Note that JavaScript converts all these
        // values into strings by calling toString(), so they fail due
        // to the key system not being supported, not due to the type.
        {
            exception: 'NotSupportedError',
            func: function () {
                return navigator.requestMediaKeySystemAccess(null, [{}]);
            }
        },
        {
            exception: 'NotSupportedError',
            func: function () {
                return navigator.requestMediaKeySystemAccess(undefined, [{}]);
            }
        },
        {
            exception: 'NotSupportedError',
            func: function () {
                return navigator.requestMediaKeySystemAccess(1, [{}]);
            }
        },
        {
            exception: 'InvalidAccessError',
            func: function () {
                return navigator.requestMediaKeySystemAccess(new Uint8Array(0), [{}]);
            }
        },
        {
            exception: 'InvalidAccessError',
            func: function () {
                return navigator.requestMediaKeySystemAccess('', [{}]);
            }
        },
        {
            exception: 'NotSupportedError',
            func: function () {
                return navigator.requestMediaKeySystemAccess('unsupported', [{}]);
            }
        },
        // Non-ASCII names.
        {
            exception: 'NotSupportedError',
            func: function () {
                return navigator.requestMediaKeySystemAccess(keysystem + '\u263A', [{}]);
            }
        },
        // Empty sequence of MediaKeySystemConfiguration.
        {
            exception: 'InvalidAccessError',
            func: function () {
                return navigator.requestMediaKeySystemAccess(keysystem, []);
            }
        },
        // Invalid sequences of MediaKeySystemConfigurations.
        {
            exception: 'TypeError',
            func: function () {
                return navigator.requestMediaKeySystemAccess(keysystem, {});
            }
        },
        {
            exception: 'TypeError',
            func: function () {
                return navigator.requestMediaKeySystemAccess(keysystem, "invalid");
            }
        },
        {
            exception: 'TypeError',
            func: function () {
                return navigator.requestMediaKeySystemAccess(keysystem, [{}, 6]);
            }
        },
        {
            exception: 'TypeError',
            func: function () {
                return navigator.requestMediaKeySystemAccess(keysystem, ["invalid", "upsupported"]);
            }
        }
    ];

    async_test(function (test) {
        var createPromises = kRequestMediaKeySystemAccessExceptionsTestCases.map(function (testCase) {
            return test_exception(testCase);
        });
        Promise.all(createPromises).then(function (result) {
            test.done();
        }).catch(function (error) {
            forceTestFailureFromPromise(test, error, 'requestMediaKeySystemAccess() tests failed');
        });
    }, 'Test Navigator.requestMediaKeySystemAccess() exceptions.');

    async_test(function (test) {
        assert_equals(typeof navigator.requestMediaKeySystemAccess, 'function');
        navigator.requestMediaKeySystemAccess(keysystem, [configuration]).then(function (access) {
            assert_not_equals(access, null);
            assert_equals(typeof access, 'object');
            assert_equals(access.keySystem, keysystem);
            assert_equals(typeof access.getConfiguration, 'function');
            assert_equals(typeof access.createMediaKeys, 'function');
            test.done();
        }).catch(function (error) {
            forceTestFailureFromPromise(test, error, 'requestMediaKeySystemAccess() tests failed');
        });
    }, 'Test Navigator.requestMediaKeySystemAccess().');

    async_test(function (test) {
        var access;

        navigator.requestMediaKeySystemAccess(keysystem, [configuration]).then(function (result) {
            access = result;
            assert_equals(access.keySystem, keysystem);
            return access.createMediaKeys();
        }).then(function (mediaKeys) {
            assert_not_equals(mediaKeys, null);
            assert_equals(typeof mediaKeys, 'object');
            assert_equals(typeof mediaKeys.createSession, 'function');
            assert_equals(typeof mediaKeys.setServerCertificate, 'function');

            // Test creation of a second MediaKeys.
            // The extra parameter is ignored.
            return access.createMediaKeys('extra');
        }).then(function (mediaKeys) {
            assert_not_equals(mediaKeys, null);
            assert_equals(typeof mediaKeys, 'object');
            assert_equals(typeof mediaKeys.createSession, 'function');
            assert_equals(typeof mediaKeys.setServerCertificate, 'function');
            test.done();
        }).catch(function (error) {
            forceTestFailureFromPromise(test, error, 'create() tests failed');
        });
    }, 'Test MediaKeySystemAccess createMediaKeys().');

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

    async_test(function (test) {
        navigator.requestMediaKeySystemAccess(keysystem, [configuration])
            .then(function (access) {
                return access.createMediaKeys();
            })
            .then(function (mediaKeys) {
                var sessionPromises = kCreateSessionExceptionsTestCases.map(function (testCase) {
                    return test_exception(testCase, mediaKeys);
                });
                sessionPromises = sessionPromises.concat(test_unsupported_sessionType(mediaKeys));
                assert_not_equals(sessionPromises.length, 0);
                return Promise.all(sessionPromises);
            })
            .then(function (result) {
                test.done();
            })
            .catch(function (error) {
                forceTestFailureFromPromise(test, error, 'createSession() tests failed');
            });
    }, 'Test MediaKeys createSession() exceptions.');

    var kGenerateRequestExceptionsTestCases = [
        // Tests in this set use a shortened parameter name due to
        // format_value() only returning the first 60 characters as the
        // result. With a longer name the first 60 characters is not
        // enough to determine which test failed. Even with the
        // shortened name, the error message for the last couple of
        // tests is the same.
        // Too few parameters.
        {
            exception: 'TypeError',
            func: function (mk1) {
                return mk1.createSession().generateRequest();
            }
        },
        {
            exception: 'TypeError',
            func: function (mk2) {
                return mk2.createSession().generateRequest('');
            }
        },
        {
            exception: 'TypeError',
            func: function (mk3) {
                return mk3.createSession().generateRequest(null);
            }
        },
        {
            exception: 'TypeError',
            func: function (mk4) {
                return mk4.createSession().generateRequest(undefined);
            }
        },
        {
            exception: 'TypeError',
            func: function (mk5) {
                return mk5.createSession().generateRequest(1);
            }
        },
        {
            exception: 'TypeError',
            func: function (mk6) {
                return mk6.createSession().generateRequest(new Uint8Array(0));
            }
        },
        {
            exception: 'TypeError',
            func: function (mk7, _, initData) {
                return mk7.createSession().generateRequest(initData);
            }
        },
        // Invalid parameters.
        {
            exception: 'InvalidAccessError',
            func: function (mk8, _, initData) {
                return mk8.createSession().generateRequest('', initData);
            }
        },
        // Not supported initDataTypes.
        {
            exception: 'NotSupportedError',
            func: function (mk9, _, initData) {
                return mk9.createSession().generateRequest(null, initData);
            }
        },
        {
            exception: 'NotSupportedError',
            func: function (mk10, _, initData) {
                return mk10.createSession().generateRequest(undefined, initData);
            }
        },
        {
            exception: 'NotSupportedError',
            func: function (mk11, _, initData) {
                return mk11.createSession().generateRequest(1, initData);
            }
        },
        {
            exception: 'InvalidAccessError',
            func: function (mk12, _, initData) {
                return mk12.createSession().generateRequest(new Uint8Array(0), initData);
            }
        },
        {
            exception: 'NotSupportedError',
            func: function (mk13, _, initData) {
                return mk13.createSession().generateRequest('unsupported', initData);
            }
        },
        {
            exception: 'NotSupportedError',
            func: function (mk14, _, initData) {
                return mk14.createSession().generateRequest('video/webm', initData);
            }
        },
        {
            exception: 'NotSupportedError',
            func: function (mk15, _, initData) {
                return mk15.createSession().generateRequest('video/mp4', initData);
            }
        },
        {
            exception: 'NotSupportedError',
            func: function (mk16, _, initData) {
                return mk16.createSession().generateRequest('video/cenc', initData);
            }
        },
        {
            exception: 'NotSupportedError',
            func: function (mk17, _, initData) {
                return mk17.createSession().generateRequest('web\u263A', initData);
            }
        }
    ];

    var kTypeSpecificGenerateRequestExceptionsTestCases = [
        // Tests in this set use a shortened parameter name due to
        // format_value() only returning the first 60 characters as the
        // result. With a longer name the first 60 characters is not
        // enough to determine which test failed. Even with the
        // shortened name, the error message for the last couple of
        // tests is the same.

        // Too few parameters.
        {
            exception: 'TypeError',
            func: function (mk1, type) {
                return mk1.createSession().generateRequest(type);
            }
        },
        // Invalid parameters.
        {
            exception: 'TypeError',
            func: function (mk2, type) {
                return mk2.createSession().generateRequest(type, '');
            }
        },
        {
            exception: 'TypeError',
            func: function (mk3, type) {
                return mk3.createSession().generateRequest(type, null);
            }
        },
        {
            exception: 'TypeError',
            func: function (mk4, type) {
                return mk4.createSession().generateRequest(type, undefined);
            }
        },
        {
            exception: 'TypeError',
            func: function (mk5, type) {
                return mk5.createSession().generateRequest(type, 1);
            }
        },
        {
            exception: 'InvalidAccessError',
            func: function (mk6, type) {
                return mk6.createSession().generateRequest(type, new Uint8Array(0));
            }
        }
    ];

    async_test(function (test) {
        isInitDataTypeSupported(keysystem, initDataType)
            .then(function (isTypeSupported) {
                assert_true(isTypeSupported);
                return navigator.requestMediaKeySystemAccess(keysystem, [configuration]);
            })
            .then(function (access) {
                return access.createMediaKeys();
            })
            .then(function (mediaKeys) {
                var mp4SessionPromises = kTypeSpecificGenerateRequestExceptionsTestCases.map(function (testCase) {
                    return test_exception(testCase, mediaKeys, initDataType, initData);
                });
                assert_not_equals(mp4SessionPromises.length, 0);
                return Promise.all(mp4SessionPromises);
            })
            .then(function (result) {
                test.done();
            })
            .catch(function (error) {
                forceTestFailureFromPromise(test, error, 'generateRequest() tests failed');
            });
    }, 'Test MediaKeys generateRequest() exceptions.');

    var kLoadExceptionsTestCases = [
        // Too few parameters.
        {
            exception: 'TypeError',
            func: function (mk1) {
                return mk1.createSession('temporary').load();
            }
        },
        // 'temporary' sessions are never allowed, so always return
        // 'InvalidAccessError'.
        {
            exception: 'InvalidAccessError',
            func: function (mk3) {
                return mk3.createSession('temporary').load('');
            }
        },
        {
            exception: 'InvalidAccessError',
            func: function (mk4) {
                return mk4.createSession('temporary').load(1);
            }
        },
        {
            exception: 'InvalidAccessError',
            func: function (mk5) {
                return mk5.createSession('temporary').load('!@#$%^&*()');
            }
        },
        {
            exception: 'InvalidAccessError',
            func: function (mk6) {
                return mk6.createSession('temporary').load('1234');
            }
        }
    ];

    async_test(function (test) {
        navigator.requestMediaKeySystemAccess(keysystem, [configuration])
            .then(function (access) {
                return access.createMediaKeys();
            })
            .then(function (mediaKeys) {
                var sessionPromises = kLoadExceptionsTestCases.map(function (testCase) {
                    return test_exception(testCase, mediaKeys);
                });
                assert_not_equals(sessionPromises.length, 0);
                return Promise.all(sessionPromises);
            })
            .then(function () {
                test.done();
            })
            .catch(function (error) {
                forceTestFailureFromPromise(test, error, 'load() tests failed');
            });
    }, 'Test MediaKeys load() exceptions.');

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
    try {
        navigator.requestMediaKeySystemAccess(keysystem, [configuration])
            .then(function (access) {
                return access.createMediaKeys();
            })
            .then(function (mediaKeys) {
                runCreateSessionTests(mediaKeys)
            }
        );
    } catch (e) {
        consoleWrite(e);
        runCreateSessionTests()
    }

    function runCreateSessionTests(mediaKeys) {
        kCreateSessionTestCases.map(function (testCase, index) {
            var mediaKeySession = undefined;
            test(function (test) {
                try {
                    mediaKeySession = testCase.func.call(null, mediaKeys);
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                    test.done();
                }
            }, "Test MediaKeys " + testCase.testCaseName);
            //if (mediaKeySession) {
            test(function (test) {
                try {
                    assert_equals(typeof mediaKeySession, 'object');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession is of type object");
            test(function (test) {
                try {
                    assert_equals(typeof mediaKeySession.addEventListener, 'function');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession.addEventListener is of type function");
            test(function (test) {
                try {
                    assert_equals(typeof mediaKeySession.expiration, 'number');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession.expiration is of type number");
            test(function (test) {
                try {
                    assert_equals(typeof mediaKeySession.closed, 'object');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession.closed is of type object");
            test(function (test) {
                try {
                    assert_equals(typeof mediaKeySession.keyStatuses, 'object');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession.keyStatuses is of type object");
            test(function (test) {
                try {
                    assert_equals(typeof mediaKeySession.onkeystatuseschange, 'object');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession.onkeystatuseschange is of type object");
            test(function (test) {
                try {
                    assert_equals(typeof mediaKeySession.onmessage, 'object');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession.onmessage is of type object");
            test(function (test) {
                try {
                    assert_equals(typeof mediaKeySession.generateRequest, 'function');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession.generateRequest is of type function");
            test(function (test) {
                try {
                    assert_equals(typeof mediaKeySession.load, 'function');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession.load is of type function");
            test(function (test) {
                try {
                    assert_equals(typeof mediaKeySession.update, 'function');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession.update is of type function");
            test(function (test) {
                try {
                    assert_equals(typeof mediaKeySession.close, 'function');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession.close is of type function");
            test(function (test) {
                try {
                    assert_equals(typeof mediaKeySession.remove, 'function');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession.remove is of type function");
            test(function (test) {
                try {
                    assert_equals(mediaKeySession.sessionId, '');
                } catch (e) {
                    assert_true(testCase.isNotSupportedAllowed);
                }
            }, testCase.testCaseName + " mediaKeySession.sessionId is ''");
            //}
        });
    }


// This function checks that calling generateRequest() works for
// various sessions. |testCase.func| creates a MediaKeySession
// object, and then generateRequest() is called on that object. It
// allows for an NotSupportedError to be generated and treated as a
// success, if allowed. See comment above kCreateSessionTestCases.
    function test_generateRequest(testCase, mediaKeys, type, initData) {
        try {
            var mediaKeySession = testCase.func.call(null, mediaKeys);
            return mediaKeySession.generateRequest(type, initData);
        } catch (e) {
            assert_true(testCase.isNotSupportedAllowed);
        }
    }

    async_test(function (test) {
            isInitDataTypeSupported(keysystem, initDataType)
                .then(function (isTypeSupported) {
                    assert_true(isTypeSupported);
                    return navigator.requestMediaKeySystemAccess(keysystem, [configuration]);
                })
                .then(function (access) {
                    return access.createMediaKeys();
                })
                .then(function (mediaKeys) {
                    var mp4SessionPromises = kCreateSessionTestCases.map(function (testCase) {
                        return test_generateRequest(testCase, mediaKeys, initDataType, initData);
                    });
                    assert_not_equals(mp4SessionPromises.length, 0);
                    return Promise.all(mp4SessionPromises);
                })
                .then(function () {
                    test.done();
                })
                .catch(function (error) {
                    forceTestFailureFromPromise(test, error, 'generateRequest() tests failed');
                });
        }
        ,
        'Test MediaKeys generateRequest().'
    );

    var kUpdateSessionExceptionsTestCases = [
        // Tests in this set use a shortened parameter name due to
        // format_value() only returning the first 60 characters as the
        // result. With a longer name (mediaKeySession) the first 60
        // characters is not enough to determine which test failed.

        // Too few parameters.
        {
            exception: 'TypeError',
            func: function (s) {
                return s.update();
            }
        },
        // Invalid parameters.
        {
            exception: 'TypeError',
            func: function (s) {
                return s.update('');
            }
        },
        {
            exception: 'TypeError',
            func: function (s) {
                return s.update(null);
            }
        },
        {
            exception: 'TypeError',
            func: function (s) {
                return s.update(undefined);
            }
        },
        {
            exception: 'TypeError',
            func: function (s) {
                return s.update(1);
            }
        },
        {
            exception: 'InvalidAccessError',
            func: function (s) {
                return s.update(new Uint8Array(0));
            }
        }
    ];

    async_test(function (test) {
        isInitDataTypeSupported(keysystem, initDataType)
            .then(function (isTypeSupported) {
                assert_true(isTypeSupported);
                return navigator.requestMediaKeySystemAccess(keysystem, [configuration]);
            })
            .then(function (access) {
                return access.createMediaKeys();
            })
            .then(function (mediaKeys) {
                var mp4SessionPromises = kUpdateSessionExceptionsTestCases.map(function (testCase) {
                    var mediaKeySession = mediaKeys.createSession();
                    return mediaKeySession.generateRequest(initDataType, initData).then(function (result) {
                        return test_exception(testCase, mediaKeySession);
                    });
                });
                assert_not_equals(mp4SessionPromises.length, 0);
                return Promise.all(mp4SessionPromises);
            })
            .then(function () {
                test.done();
            })
            .catch(function (error) {
                forceTestFailureFromPromise(test, error, 'update() tests failed');
            });
    }, 'Test MediaKeySession update() exceptions.');

    function create_update_test(mediaKeys, type, initData, test) {
        var mediaKeySession = mediaKeys.createSession();
        var promise = mediaKeySession.generateRequest(type, initData).then(function (result) {
            return wait_for_message_event(mediaKeySession, handler.messagehandler, test);
        }).then(function (result) {
            // Call update() with a different license and an extra
            // parameter. The extra parameter is ignored.
            var validLicense = stringToUint8Array(handler.createJWKSet(handler.createJWK(stringToUint8Array('4567890'), stringToUint8Array('01234567890abcde'))));
            return mediaKeySession.update(validLicense, 'extra');
        });
        return promise;
    }

    async_test(function (test) {
        isInitDataTypeSupported(keysystem, initDataType)
            .then(function (isTypeSupported) {
                assert_true(isTypeSupported);
                return navigator.requestMediaKeySystemAccess(keysystem, [configuration]);
            })
            .then(function (access) {
                return access.createMediaKeys();
            })
            .then(function (mediaKeys) {
                return create_update_test(mediaKeys, initDataType, initData, test);
            })
            .then(function () {
                test.done();
            })
            .catch(function (error) {
                forceTestFailureFromPromise(test, error, 'update() tests failed');
            });
    }, 'Test MediaKeySession update().');

    function create_close_exception_test(mediaKeys) {
        var mediaKeySession = mediaKeys.createSession();
        return mediaKeySession.close()
            .then(function (result) {
                assert_unreached('close() should not succeed if session uninitialized');
            })
            .catch(function (error) {
                assert_equals(error.name, 'InvalidStateError');
                // Return something so the promise resolves.
                return Promise.resolve();
            });
    }

    async_test(function (test) {
        isInitDataTypeSupported(keysystem, initDataType)
            .then(function (isTypeSupported) {
                assert_true(isTypeSupported);
                return navigator.requestMediaKeySystemAccess(keysystem, [configuration]);
            })
            .then(function (access) {
                return access.createMediaKeys();
            })
            .then(function (mediaKeys) {
                return create_close_exception_test(mediaKeys);
            })
            .then(function () {
                test.done();
            })
            .catch(function (error) {
                forceTestFailureFromPromise(test, error, 'close() exception tests failed');
            });
    }, 'Test MediaKeySession close() exceptions.');


    function create_close_test(mediaKeys, type, initData) {
        var mediaKeySession = mediaKeys.createSession();
        var promise = mediaKeySession.generateRequest(type, initData)
            .then(function (result) {
                return mediaKeySession.close();
            })
            .then(function (result) {
                // Call close() again with an extra parameter. The extra
                // parameter is ignored.
                return mediaKeySession.close('extra');
            });
        return promise;
    }

    async_test(function (test) {
        isInitDataTypeSupported(keysystem, initDataType)
            .then(function (isTypeSupported) {
                assert_true(isTypeSupported);
                return navigator.requestMediaKeySystemAccess(keysystem, [configuration]);
            })
            .then(function (access) {
                return access.createMediaKeys();
            })
            .then(function (mediaKeys) {
                return create_close_test(mediaKeys, initDataType, initData);
            })
            .then(function () {
                test.done();
            })
            .catch(function (error) {
                forceTestFailureFromPromise(test, error, 'close() tests failed');
            });
    }, 'Test MediaKeySession close().');

    function create_remove_exception_test(mediaKeys, type, initData) {
        // remove() on an uninitialized session should fail.
        var mediaKeySession = mediaKeys.createSession('temporary');
        return mediaKeySession.remove()
            .then(function (result) {
                assert_unreached('remove() should not succeed if session uninitialized');
            }, function (error) {
                assert_equals(error.name, 'InvalidStateError');
                // remove() on a temporary session should fail.
                return mediaKeySession.generateRequest(type, initData);
            })
            .then(function (result) {
                return mediaKeySession.remove();
            })
            .then(function (result) {
                assert_unreached('remove() should not succeed for temporary sessions');
            }, function (error) {
                assert_equals(error.name, 'InvalidAccessError');
            });
    }

    async_test(function (test) {
        isInitDataTypeSupported(keysystem, initDataType)
            .then(function (isTypeSupported) {
                assert_true(isTypeSupported);
                return navigator.requestMediaKeySystemAccess(keysystem, [configuration]);
            })
            .then(function (access) {
                return access.createMediaKeys();
            })
            .then(function (mediaKeys) {
                return create_remove_exception_test(mediaKeys, initDataType, initData);
            })
            .then(function () {
                test.done();
            })
            .catch(function (error) {
                forceTestFailureFromPromise(test, error, 'remove() exception tests failed');
            });
    }, 'Test MediaKeySession remove() exceptions.');

    function create_remove_test(mediaKeys, type, initData) {
        // Clear Key may not support persistent-license sessions.
        var mediaKeySession;
        try {
            mediaKeySession = mediaKeys.createSession('persistent-license');
        } catch (error) {
            // Not supported, so return a resolved promise.
            assert_equals(error.name, 'NotSupportedError');
            return Promise.resolve();
        }
        return mediaKeySession.generateRequest(type, initData).then(function (result) {
            return mediaKeySession.remove();
        });
    }

    async_test(function (test) {
        isInitDataTypeSupported(keysystem, initDataType)
            .then(function (isTypeSupported) {
                assert_true(isTypeSupported)
                return navigator.requestMediaKeySystemAccess(keysystem, [{}]);
            })
            .then(function (access) {
                return access.createMediaKeys();
            })
            .then(function (mediaKeys) {
                return create_remove_test(mediaKeys, initDataType, initData);
            })
            .then(function (result) {
                test.done();
            })
            .catch(function (error) {
                forceTestFailureFromPromise(test, error, 'remove() tests failed');
            });
    }, 'Test MediaKeySession remove().');

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
    }, 'Test MediaKeys setServerCertificate() exceptions.');

// All calls to |func| in this group resolve. setServerCertificate with these cert may either resolve with true
// for clearkey or throw a DOMException
    var kSetServerCertificateTestCases = [
        {
            // Pass in ArrayBufferView
            func: function (mk) {
                var cert = new Uint8Array(200);
                assert_true(ArrayBuffer.isView(cert));

                return new Promise(function(resolve,reject){
                    mk.setServerCertificate(cert).then(function(value){
                        resolve(value);
                    }).catch(function(error){
                        if(Object.prototype.toString.call(error) === "[object DOMException]"){
                            resolve(false);
                        };
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
                return new Promise(function(resolve){
                    mk.setServerCertificate(cert).then(function(resolveValue){
                        resolve(resolveValue);
                    }).catch(function(error){
                        if(Object.prototype.toString.call(error) === "[object DOMException]"){
                            resolve(false);
                        };
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
           //    var t =  Object.prototype.toString.call(error) === "[object DOMException]";
                forceTestFailureFromPromise(test, error, 'setServerCertificate() test failed');
            });
    }, 'Test MediaKeys setServerCertificate().');
}
// FIXME: Add syntax checks for MediaKeys.IsTypeSupported().
// FIXME: Add syntax checks for MediaKeyError and MediaKeySession events.
// FIXME: Add HTMLMediaElement syntax checks, e.g. setMediaKeys, mediakeys, onencrypted.
