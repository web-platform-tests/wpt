
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
            noDeriveKeyKeys,
        } = results;

        Object.keys(sizes).forEach(function(namedCurve) {
            // Basic success case
            promise_test(function(test) {
                return subtle.deriveKey({name: "ECDH", public: publicKeys[namedCurve]}, privateKeys[namedCurve], {name: "HMAC", hash: "SHA-256", length: 256}, true, ["sign", "verify"])
                .then(function(key) {return crypto.subtle.exportKey("raw", key);})
                .then(function(exportedKey) {
                    assert_array_equals(new Uint8Array(exportedKey), derivations[namedCurve].slice(0, 32), "Derived correct key");
                }, function(err) {
                    assert_unreached("deriveKey failed with error " + err.name + ": " + err.message);
                });
            }, namedCurve + " good parameters");

            // Case insensitivity check
            promise_test(function(test) {
                return subtle.deriveKey({name: "EcDh", public: publicKeys[namedCurve]}, privateKeys[namedCurve], {name: "HMAC", hash: "SHA-256", length: 256}, true, ["sign", "verify"])
                .then(function(key) {return crypto.subtle.exportKey("raw", key);})
                .then(function(exportedKey) {
                    assert_array_equals(new Uint8Array(exportedKey), derivations[namedCurve].slice(0, 32), "Derived correct key");
                }, function(err) {
                    assert_unreached("deriveKey failed with error " + err.name + ": " + err.message);
                });
            }, namedCurve + " mixed case parameters");
            // Errors to test:

            // - missing public property TypeError
            promise_test(function(test) {
                return subtle.deriveKey({name: "ECDH"}, privateKeys[namedCurve], {name: "HMAC", hash: "SHA-256", length: 256}, true, ["sign", "verify"])
                .then(function(key) {return crypto.subtle.exportKey("raw", key);})
                .then(function(exportedKey) {
                    assert_unreached("deriveKey succeeded but should have failed with TypeError");
                }, function(err) {
                    assert_equals(err.name, "TypeError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " missing public curve");

            // - Non CryptoKey public property TypeError
            promise_test(function(test) {
                return subtle.deriveKey({name: "ECDH", public: {message: "Not a CryptoKey"}}, privateKeys[namedCurve], {name: "HMAC", hash: "SHA-256", length: 256}, true, ["sign", "verify"])
                .then(function(key) {return crypto.subtle.exportKey("raw", key);})
                .then(function(exportedKey) {
                    assert_unreached("deriveKey succeeded but should have failed with TypeError");
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
                return subtle.deriveKey({name: "ECDH", public: publicKey}, privateKeys[namedCurve], {name: "HMAC", hash: "SHA-256", length: 256}, true, ["sign", "verify"])
                .then(function(key) {return crypto.subtle.exportKey("raw", key);})
                .then(function(exportedKey) {
                    assert_unreached("deriveKey succeeded but should have failed with InvalidAccessError");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " mismatched curves");

            // - not ECDH public property InvalidAccessError
            promise_test(function(test) {
                return subtle.deriveKey({name: "ECDH", public: ecdsaKeyPairs[namedCurve].publicKey}, privateKeys[namedCurve], {name: "HMAC", hash: "SHA-256", length: 256}, true, ["sign", "verify"])
                .then(function(key) {return crypto.subtle.exportKey("raw", key);})
                .then(function(exportedKey) {
                    assert_unreached("deriveKey succeeded but should have failed with InvalidAccessError");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " public property of algorithm is not an ECDSA public key");

            // - No deriveKey usage in baseKey InvalidAccessError
            promise_test(function(test) {
                return subtle.deriveKey({name: "ECDH", public: publicKeys[namedCurve]}, noDeriveKeyKeys[namedCurve], {name: "HMAC", hash: "SHA-256", length: 256}, true, ["sign", "verify"])
                .then(function(key) {return crypto.subtle.exportKey("raw", key);})
                .then(function(exportedKey) {
                    assert_unreached("deriveKey succeeded but should have failed with InvalidAccessError");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " no deriveKey usage for base key");

            // - Use public key for baseKey InvalidAccessError
            promise_test(function(test) {
                return subtle.deriveKey({name: "ECDH", public: publicKeys[namedCurve]}, publicKeys[namedCurve], {name: "HMAC", hash: "SHA-256", length: 256}, true, ["sign", "verify"])
                .then(function(key) {return crypto.subtle.exportKey("raw", key);})
                .then(function(exportedKey) {
                    assert_unreached("deriveKey succeeded but should have failed with InvalidAccessError");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " base key is not a private key");

            // - Use private key for public property InvalidAccessError
            promise_test(function(test) {
                return subtle.deriveKey({name: "ECDH", public: privateKeys[namedCurve]}, privateKeys[namedCurve], {name: "HMAC", hash: "SHA-256", length: 256}, true, ["sign", "verify"])
                .then(function(key) {return crypto.subtle.exportKey("raw", key);})
                .then(function(exportedKey) {
                    assert_unreached("deriveKey succeeded but should have failed with InvalidAccessError");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw correct error, not " + err.name + ": " + err.message);
                });
            }, namedCurve + " public property value is a private key");

            // - Use secret key for public property InvalidAccessError
            promise_test(function(test) {
                return subtle.generateKey({name: "HMAC", hash: "SHA-256", length: 256}, true, ["sign", "verify"])
                .then(function(secretKey) {
                    return subtle.deriveKey({name: "ECDH", public: secretKey}, privateKeys[namedCurve], {name: "AES-CBC", length: 256}, true, ["sign", "verify"])
                    .then(function(key) {return crypto.subtle.exportKey("raw", key);})
                    .then(function(exportedKey) {
                        assert_unreached("deriveKey succeeded but should have failed with InvalidAccessError");
                    }, function(err) {
                        assert_equals(err.name, "InvalidAccessError", "Should throw correct error, not " + err.name + ": " + err.message);
                    });
                });
            }, namedCurve + " public property value is a secret key");
        });
    });

    function importKeys(pkcs8, spki, sizes) {
        var privateKeys = {};
        var publicKeys = {};
        var ecdsaKeyPairs = {};
        var noDeriveKeyKeys = {};

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
                                            false, ["deriveBits"])
                            .then(function(key) {
                                noDeriveKeyKeys[namedCurve] = key;
                            }, function (err) {
                                noDeriveKeyKeys[namedCurve] = null;
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
               .then(function(results) {return {privateKeys: privateKeys, publicKeys: publicKeys, ecdsaKeyPairs: ecdsaKeyPairs, noDeriveKeyKeys: noDeriveKeyKeys}});
    }

}
