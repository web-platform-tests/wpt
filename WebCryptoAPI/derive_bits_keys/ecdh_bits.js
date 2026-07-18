
function define_tests() {
    // May want to test prefixed implementations.
    var subtle = self.crypto.subtle;

    var fixtures = getEcdhTestFixtures();
    var pkcs8 = fixtures.pkcs8;
    var spki = fixtures.spki;
    var sizes = fixtures.sizes;
    var derivations = fixtures.derivations;

    return importKeys(pkcs8, spki, sizes)
    .then(function(results) {
        const {
            publicKeys,
            privateKeys,
            ecdsaKeyPairs,
            noDeriveBitsKeys,
        } = results;

        Object.keys(sizes).forEach(function(namedCurve) {
            // Basic success case
            promise_test(function(test) {
                return subtle.deriveBits({name: "ECDH", public: publicKeys[namedCurve]}, privateKeys[namedCurve], 8 * sizes[namedCurve])
                .then(function(derivation) {
                    assert_true(equalBuffers(derivation, derivations[namedCurve]), "Derived correct bits");
                }, function(err) {
                    assert_unreached("deriveBits failed with error " + err.name + ": " + err.message);
                });
            }, namedCurve + " good parameters");

            // Case insensitivity check
            promise_test(function(test) {
                return subtle.deriveBits({name: "EcDh", public: publicKeys[namedCurve]}, privateKeys[namedCurve], 8 * sizes[namedCurve])
                .then(function(derivation) {
                    assert_true(equalBuffers(derivation, derivations[namedCurve]), "Derived correct bits");
                }, function(err) {
                    assert_unreached("deriveBits failed with error " + err.name + ": " + err.message);
                });
            }, namedCurve + " mixed case parameters");

            // Shorter than entire derivation per algorithm
            promise_test(function(test) {
                return subtle.deriveBits({name: "ECDH", public: publicKeys[namedCurve]}, privateKeys[namedCurve], 8 * sizes[namedCurve] - 32)
                .then(function(derivation) {
                    assert_true(equalBuffers(derivation, derivations[namedCurve], 8 * sizes[namedCurve] - 32), "Derived correct bits");
                }, function(err) {
                    assert_unreached("deriveBits failed with error " + err.name + ": " + err.message);
                });
            }, namedCurve + " short result");

            // Non-multiple of 8
            promise_test(function(test) {
                return subtle.deriveBits({name: "ECDH", public: publicKeys[namedCurve]}, privateKeys[namedCurve], 8 * sizes[namedCurve] - 11)
                .then(function(derivation) {
                    assert_true(equalBuffers(derivation, derivations[namedCurve], 8 * sizes[namedCurve] - 11), "Derived correct bits");
                }, function(err) {
                    assert_unreached("deriveBits failed with error " + err.name + ": " + err.message);
                });
            }, namedCurve + " non-multiple of 8 bits");

            // Errors to test:

            // - missing public property TypeError
            promise_test(function(test) {
                return subtle.deriveBits({name: "ECDH"}, privateKeys[namedCurve], 8 * sizes[namedCurve])
                .then(function(derivation) {
                    assert_unreached("deriveBits succeeded but should have failed with TypeError");
                }, function(err) {
                    assert_equals(err.name, "TypeError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " missing public curve");

            // - Non CryptoKey public property TypeError
            promise_test(function(test) {
                return subtle.deriveBits({name: "ECDH", public: {message: "Not a CryptoKey"}}, privateKeys[namedCurve], 8 * sizes[namedCurve])
                .then(function(derivation) {
                    assert_unreached("deriveBits succeeded but should have failed with TypeError");
                }, function(err) {
                    assert_equals(err.name, "TypeError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " public property of algorithm is not a CryptoKey");

            // - wrong named curve
            promise_test(function(test) {
                let publicKey = publicKeys["P-256"];
                if (namedCurve === "P-256") {
                    publicKey = publicKeys["P-384"];
                }
                return subtle.deriveBits({name: "ECDH", public: publicKey}, privateKeys[namedCurve], 8 * sizes[namedCurve])
                .then(function(derivation) {
                    assert_unreached("deriveBits succeeded but should have failed with InvalidAccessError");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " mismatched curves");

            // - not ECDH public property InvalidAccessError
            promise_test(function(test) {
                return subtle.deriveBits({name: "ECDH", public: ecdsaKeyPairs[namedCurve].publicKey}, privateKeys[namedCurve], 8 * sizes[namedCurve])
                .then(function(derivation) {
                    assert_unreached("deriveBits succeeded but should have failed with InvalidAccessError");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " public property of algorithm is not an ECDSA public key");

            // - No deriveBits usage in baseKey InvalidAccessError
            promise_test(function(test) {
                return subtle.deriveBits({name: "ECDH", public: publicKeys[namedCurve]}, noDeriveBitsKeys[namedCurve], 8 * sizes[namedCurve])
                .then(function(derivation) {
                    assert_unreached("deriveBits succeeded but should have failed with InvalidAccessError");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " no deriveBits usage for base key");

            // - Use public key for baseKey InvalidAccessError
            promise_test(function(test) {
                return subtle.deriveBits({name: "ECDH", public: publicKeys[namedCurve]}, publicKeys[namedCurve], 8 * sizes[namedCurve])
                .then(function(derivation) {
                    assert_unreached("deriveBits succeeded but should have failed with InvalidAccessError");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " base key is not a private key");

            // - Use private key for public property InvalidAccessError
            promise_test(function(test) {
                return subtle.deriveBits({name: "ECDH", public: privateKeys[namedCurve]}, privateKeys[namedCurve], 8 * sizes[namedCurve])
                .then(function(derivation) {
                    assert_unreached("deriveBits succeeded but should have failed with InvalidAccessError");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " public property value is a private key");

            // - Use secret key for public property InvalidAccessError
            promise_test(function(test) {
                return subtle.generateKey({name: "AES-CBC", length: 128}, true, ["encrypt", "decrypt"])
                .then(function(secretKey) {
                    return subtle.deriveBits({name: "ECDH", public: secretKey}, privateKeys[namedCurve], 8 * sizes[namedCurve])
                    .then(function(derivation) {
                        assert_unreached("deriveBits succeeded but should have failed with InvalidAccessError");
                    }, function(err) {
                        assert_equals(err.name, "InvalidAccessError", "Should throw correct error, not " + err.name + ": " + err.message);
                    });
                });
            }, namedCurve + " public property value is a secret key");

            // - Length greater than 256, 384, 521 for particular curves OperationError
            promise_test(function(test) {
                return subtle.deriveBits({name: "ECDH", public: publicKeys[namedCurve]}, privateKeys[namedCurve], 8 * sizes[namedCurve] + 8)
                .then(function(derivation) {
                    assert_unreached("deriveBits succeeded but should have failed with OperationError");
                }, function(err) {
                    assert_equals(err.name, "OperationError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " asking for too many bits");
        });
    });

    function importKeys(pkcs8, spki, sizes) {
        var privateKeys = {};
        var publicKeys = {};
        var ecdsaKeyPairs = {};
        var noDeriveBitsKeys = {};

        var promises = [];
        Object.keys(pkcs8).forEach(function(namedCurve) {
            var operation = subtle.importKey("pkcs8", pkcs8[namedCurve],
                                            {name: "ECDH", namedCurve: namedCurve},
                                            false, ["deriveBits", "deriveKey"])
                            .then(function(key) {
                                privateKeys[namedCurve] = key;
                            }, function (err) {
                                privateKeys[namedCurve] = null;
                            });
            promises.push(operation);
        });
        Object.keys(pkcs8).forEach(function(namedCurve) {
            var operation = subtle.importKey("pkcs8", pkcs8[namedCurve],
                                            {name: "ECDH", namedCurve: namedCurve},
                                            false, ["deriveKey"])
                            .then(function(key) {
                                noDeriveBitsKeys[namedCurve] = key;
                            }, function (err) {
                                noDeriveBitsKeys[namedCurve] = null;
                            });
            promises.push(operation);
        });
        Object.keys(spki).forEach(function(namedCurve) {
            var operation = subtle.importKey("spki", spki[namedCurve],
                                            {name: "ECDH", namedCurve: namedCurve},
                                            false, [])
                            .then(function(key) {
                                publicKeys[namedCurve] = key;
                            }, function (err) {
                                publicKeys[namedCurve] = null;
                            });
            promises.push(operation);
        });
        Object.keys(sizes).forEach(function(namedCurve) {
            var operation = subtle.generateKey({name: "ECDSA", namedCurve: namedCurve}, false, ["sign", "verify"])
                            .then(function(keyPair) {
                                ecdsaKeyPairs[namedCurve] = keyPair;
                            }, function (err) {
                                ecdsaKeyPairs[namedCurve] = null;
                            });
            promises.push(operation);
        });

        return Promise.all(promises)
               .then(function(results) {return {privateKeys: privateKeys, publicKeys: publicKeys, ecdsaKeyPairs: ecdsaKeyPairs, noDeriveBitsKeys: noDeriveBitsKeys}});
    }

}
