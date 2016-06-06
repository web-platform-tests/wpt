
function run_test() {
    var subtle = crypto.subtle; // Change to test prefixed implementations

    // Source file aes_XXX_vectors.js provides the getTestVectors method
    // for the AES-XXX algorithm that drives these tests.
    var vectors = getTestVectors();
    var passingVectors = vectors.passing;
    var failingVectors = vectors.failing;
    var decryptionFailingVectors = vectors.decryptionFailing;

    // Check for successful encryption.
    passingVectors.forEach(function(vector) {
        importVectorKey(vector, ["encrypt", "decrypt"])
        .then(function(vector) {
            promise_test(function(test) {
                return subtle.encrypt(vector.algorithm, vector.key, vector.plaintext)
                .then(function(result) {
                    assert_true(equalBuffers(result, vector.result), "Should return expected result");
                }, function(err) {
                    assert_unreached("encrypt error for test " + vector.name + ": " + err.message);
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

    // Check for successful decryption.
    passingVectors.forEach(function(vector) {
        importVectorKey(vector, ["encrypt", "decrypt"])
        .then(function(vector) {
            promise_test(function(test) {
                return subtle.decrypt(vector.algorithm, vector.key, vector.result)
                .then(function(result) {
                    assert_true(equalBuffers(result, vector.plaintext), "Should return expected result");
                }, function(err) {
                    assert_unreached("decrypt error for test " + vector.name + ": " + err.message);
                });
            }, vector.name + " decryption");
        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importKey failed for " + vector.name);
            }, "importKey step for decryption: " + vector.name);
        });
    });

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

    // Everything that succeeded decrypting should fail if no "decrypt" usage.
    passingVectors.forEach(function(vector) {
        // Don't want to overwrite key being used for success tests!
        var badVector = Object.assign({}, vector);
        badVector.key = null;

        importVectorKey(badVector, ["encrypt"])
        .then(function(vector) {
            promise_test(function(test) {
                return subtle.decrypt(vector.algorithm, vector.key, vector.result)
                .then(function(result) {
                    assert_unreached("should have thrown exception for test " + vector.name);
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw an InvalidAccessError")
                });
            }, vector.name + " without decrypt usage");
        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importKey failed for " + vector.name);
            }, "importKey step: " + vector.name + " without decrypt usage");
        });
    });

    // Check for OperationError due to data lengths.
    failingVectors.forEach(function(vector) {
        importVectorKey(vector, ["encrypt", "decrypt"])
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

    // Check for OperationError due to data lengths for decryption, too.
    failingVectors.forEach(function(vector) {
        importVectorKey(vector, ["encrypt", "decrypt"])
        .then(function(vector) {
            promise_test(function(test) {
                return subtle.decrypt(vector.algorithm, vector.key, vector.result)
                .then(function(result) {
                    assert_unreached("should have thrown exception for test " + vector.name);
                }, function(err) {
                    assert_equals(err.name, "OperationError", "Should throw an OperationError")
                });
            }, vector.name + " decryption");
        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importKey failed for " + vector.name);
            }, "importKey step: decryption " + vector.name);
        });
    });

    // Check for decryption failing for algorithm-specific reasons (such as bad
    // padding for AES-CBC).
    decryptionFailingVectors.forEach(function(vector) {
        importVectorKey(vector, ["encrypt", "decrypt"])
        .then(function(vector) {
            promise_test(function(test) {
                return subtle.decrypt(vector.algorithm, vector.key, vector.result)
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
            }, "importKey step: decryption " + vector.name);
        });
    });

    // A test vector has all needed fields for encryption, EXCEPT that the
    // key field may be null. This function replaces that null with the Correct
    // CryptoKey object.
    //
    // Returns a Promise that yields an updated vector on success.
    function importVectorKey(vector, usages) {
        if (vector.key !== null) {
            return new Promise(function(resolve, reject) {
                resolve(vector);
            });
        } else {
            return subtle.importKey("raw", vector.keyBuffer, {name: vector.algorithm.name}, false, usages)
            .then(function(key) {
                vector.key = key;
                return vector;
            });
        }
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
