
function run_test() {
    var subtle = crypto.subtle; // Change to test prefixed implementations

    // Source file rsa_vectors.js provides the getTestVectors method
    // for the RSA-OAEP algorithm that drives these tests.
    var vectors = getTestVectors();
    var passingVectors = vectors.passing;
    var failingVectors = vectors.failing;

    // Check for successful encryption.
    passingVectors.forEach(function(vector) {
        importVectorKeys(vector, ["encrypt"], ["decrypt"])
        .then(function(vectors) {
            ["SHA-1", "SHA-256", "SHA-384", "SHA-512"].forEach(function(hash) {
                var algorithm = Object.assign({}, vector.algorithm);
                algorithm.hash = hash;
                var name = "RSA-OAEP with " + hash + " and no label"

                promise_test(function(test) {
                    return subtle.encrypt(algorithm, vector.publicKey, vector.plaintext)
                    .then(function(ciphertext) {
                        assert_equals(ciphertext.byteLength * 8, vector.privateKey.algorithm.modulusLength, "Ciphertext length matches modulus length");

                        // Can we get the original plaintext back via decrypt?
                        return subtle.decrypt(algorithm, vector.privateKey, ciphertext)
                        .then(function(result) {
                            assert_true(equalBuffers(result, vector.plaintext), "Round trip returns original plaintext");
                            return ciphertext;
                        }, function(err) {
                            assert_unreached("decrypt error for test " + name + ": " + err.message);
                        });
                    }, function(err) {
                        assert_unreached("encrypt error for test " + name + ": " + err.message);
                    })
                    .then(function(priorCiphertext) {
                        // Will a second encrypt give us different ciphertext, as it should?
                        return subtle.encrypt(algorithm, vector.publicKey, vector.plaintext)
                        .then(function(ciphertext) {
                            assert_false(equalBuffers(priorCiphertext, ciphertext), "Two encrypts give different results")
                        }, function(err) {
                            assert_unreached("second time encrypt error for test " + name + ": " + err.message);
                        });
                    }, function(err) {
                        assert_unreached("second decrypt error for test " + name + ": " + err.message);
                    });
                }, name);
            });

        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
            }, "importVectorKeys step: " + vector.name);
        });
    });

    return;

    // Everything that succeeded should fail if no "encrypt" usage.
    passingVectors.forEach(function(vector) {
        // Don't want to overwrite key being used for success tests!
        var badVector = Object.assign({}, vector);
        badVector.key = null;

        importVectorKey(badVector, ["decrypt"])
        .then(function(vector) {
            promise_test(function(test) {
                return subtle.encrypt(vector.algorithm, vector.key, vector.plaintext)
                .then(function(result) {
                    assert_unreached("should have thrown exception for test " + vector.name);
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw an InvalidAccessError")
                });
            }, vector.name + " without encrypt usage");
        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importKey failed for " + vector.name);
            }, "importKey step: " + vector.name + " without encrypt usage");
        });
    });

    // Check for OperationError due to bad tag length.
    failingVectors.forEach(function(vector) {
        importVectorKey(vector, ["encrypt"])
        .then(function(vector) {
            promise_test(function(test) {
                return subtle.encrypt(vector.algorithm, vector.key, vector.plaintext)
                .then(function(result) {
                    assert_unreached("should have thrown exception for test " + vector.name);
                }, function(err) {
                    assert_equals(err.name, "OperationError", "Should throw an OperationError")
                });
            }, vector.name);
        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importKey failed for " + vector.name);
            }, "importKey step: " + vector.name);
        });
    });

    // A test vector has all needed fields for encryption, EXCEPT that the
    // key field may be null. This function replaces that null with the Correct
    // CryptoKey object.
    //
    // Returns a Promise that yields an updated vector on success.
    function importVectorKeys(vector, publicKeyUsages, privateKeyUsages) {
        var publicPromise, privatePromise;

        if (vector.publicKey !== null) {
            publicPromise = new Promise(function(resolve, reject) {
                resolve(vector);
            });
        } else {
            publicPromise = subtle.importKey(vector.publicKeyFormat, vector.publicKeyBuffer, {name: vector.algorithm.name, hash: vector.hash}, false, publicKeyUsages)
            .then(function(key) {
                vector.publicKey = key;
                return vector;
            });
        }

        if (vector.privateKey !== null) {
            privatePromise = new Promise(function(resolve, reject) {
                resolve(vector);
            });
        } else {
            privatePromise = subtle.importKey(vector.privateKeyFormat, vector.privateKeyBuffer, {name: vector.algorithm.name, hash: vector.hash}, false, privateKeyUsages)
            .then(function(key) {
                vector.privateKey = key;
                return vector;
            });
        }

        return Promise.all([publicPromise, privatePromise]);
    }

    function equalBuffers(a, b) {
        if (a.byteLength !== b.byteLength) {
            return false;
        }

        var aBytes = new Uint8Array(a);
        var bBytes = new Uint8Array(b);

        for (var i=0; i<a.byteLength; i++) {
            if (aBytes[i] !== bBytes[i]) {
                return false;
            }
        }

        return true;
    }

    return;
}
