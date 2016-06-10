
function run_test() {
    var subtle = crypto.subtle; // Change to test prefixed implementations

    // When are all these tests really done? When all the promises they use have resolved.
    var all_promises = [];

    // Source file rsa_pss_vectors.js provides the getTestVectors method
    // for the RSA-PSS algorithm that drives these tests.
    var vectors = getTestVectors();
    var passingVectors = vectors.passing;
    var failingVectors = vectors.failing;

    // Test verification first, because signing tests rely on that working
    passingVectors.forEach(function(vector) {
        var promise = importVectorKeys(vector, ["verify"], ["sign"])
        .then(function(vectors) {
            if (!("signature" in vector)) {
                return;
            }

            promise_test(function(test) {
                var operation = subtle.verify(vector.algorithm, vector.publicKey, vector.signature, vector.plaintext)
                .then(function(is_verified) {
                    assert_true(is_verified, "Signature verified");
                }, function(err) {
                    assert_unreached("Verification should not throw error " + vector.name + ": " + err.message + "'");
                });

                return operation;
            }, vector.name + " verification");

        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested verification.
            promise_test(function(test) {
                assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
            }, "importVectorKeys step: " + vector.name + " verification");
        });

        all_promises.push(promise);
    });

    // Test verification with an altered buffer
    passingVectors.forEach(function(vector) {
        var promise = importVectorKeys(vector, ["verify"], ["sign"])
        .then(function(vectors) {
            if (!("signature" in vector)) {
                return;
            }

            promise_test(function(test) {
                var signature = copyBuffer(vector.signature);
                var operation = subtle.verify(vector.algorithm, vector.publicKey, signature, vector.plaintext)
                .then(function(is_verified) {
                    assert_true(is_verified, "Signature verified");
                }, function(err) {
                    assert_unreached("Verification should not throw error " + vector.name + ": " + err.message + "'");
                });

                signature[0] = 255 - signature[0];
                return operation;
            }, vector.name + " verification with altered signature");

        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
            }, "importVectorKeys step: " + vector.name + " verification with altered signature");
        });

        all_promises.push(promise);
    });

    // Check for failures due to using privateKey to verify.
    passingVectors.forEach(function(vector) {
        var promise = importVectorKeys(vector, ["verify"], ["sign"])
        .then(function(vectors) {
            promise_test(function(test) {
                return subtle.verify(vector.algorithm, vector.privateKey, vector.signature, vector.plaintext)
                .then(function(plaintext) {
                    assert_unreached("Should have thrown error for using privateKey to verify in " + vector.name + ": " + err.message + "'");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw InvalidAccessError");
                });
            }, vector.name + " using privateKey to verify");

        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
            }, "importVectorKeys step: " + vector.name + " using privateKey to verify");
        });

        all_promises.push(promise);
    });

    // Check for failures due to no "verify" usage.
    passingVectors.forEach(function(originalVector) {
        var vector = Object.assign({}, originalVector);

        var promise = importVectorKeys(vector, [], ["sign"])
        .then(function(vectors) {
            promise_test(function(test) {
                return subtle.verify(vector.algorithm, vector.publicKey, vector.signature, vector.plaintext)
                .then(function(plaintext) {
                    assert_unreached("Should have thrown error for no verify usage in " + vector.name + ": " + err.message + "'");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw InvalidAccessError");
                });
            }, vector.name + " no verify usage");

        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
            }, "importVectorKeys step: " + vector.name + " no verify usage");
        });

        all_promises.push(promise);
    });


    // Check for successful verification even if plaintext is altered after call.
    passingVectors.forEach(function(vector) {
        var promise = importVectorKeys(vector, ["verify"], ["sign"])
        .then(function(vectors) {
            promise_test(function(test) {
                var plaintext = copyBuffer(vector.plaintext);
                var operation = subtle.verify(vector.algorithm, vector.publicKey, vector.signature, plaintext)
                .then(function(is_verified) {
                    assert_true(is_verified, "Signature verified");
                }, function(err) {
                    assert_unreached("Verification should not throw error " + vector.name + ": " + err.message + "'");
                });

                plaintext[0] = 255 - plaintext[0];
                return operation;
            }, vector.name + " with altered plaintext after call");

        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
            }, "importVectorKeys step: " + vector.name + " with altered plaintext");
        });

        all_promises.push(promise);
    });

    // TODO - move this block down bit by bit until all encrypt/decrypt tests have been changed to sign/verify
    console.log("There are " + all_promises.length.toString() + " promises to wait for.");
    Promise.all(all_promises)
    .then(function() {done();})
    .catch(function() {done();})
    return;

    // Check for successful encryption.
    passingVectors.forEach(function(vector) {
        var promise = importVectorKeys(vector, ["verify"], ["sign"])
        .then(function(vectors) {
            promise_test(function(test) {
                return subtle.encrypt(vector.algorithm, vector.publicKey, vector.plaintext)
                .then(function(ciphertext) {
                    assert_equals(ciphertext.byteLength * 8, vector.privateKey.algorithm.modulusLength, "Ciphertext length matches modulus length");

                    // Can we get the original plaintext back via decrypt?
                    return subtle.decrypt(vector.algorithm, vector.privateKey, ciphertext)
                    .then(function(result) {
                        assert_true(equalBuffers(result, vector.plaintext), "Round trip returns original plaintext");
                        return ciphertext;
                    }, function(err) {
                        assert_unreached("decrypt error for test " + vector.name + ": " + err.message + "'");
                    });
                })
                .then(function(priorCiphertext) {
                    // Will a second encrypt give us different ciphertext, as it should?
                    return subtle.encrypt(vector.algorithm, vector.publicKey, vector.plaintext)
                    .then(function(ciphertext) {
                        assert_false(equalBuffers(priorCiphertext, ciphertext), "Two encrypts give different results")
                    }, function(err) {
                        assert_unreached("second time encrypt error for test " + vector.name + ": '" + err.message + "'");
                    });
                }, function(err) {
                    assert_unreached("decrypt error for test " + vector.name + ": '" + err.message + "'");
                });
            }, vector.name);

        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
            }, "importVectorKeys step: " + vector.name);
        });

        all_promises.push(promise);
    });

    // Check for failures due to too long plaintext.
    passingVectors.forEach(function(vector) {
        var promise = importVectorKeys(vector, ["verify"], ["sign"])
        .then(function(vectors) {
            // Get a one byte longer plaintext to encrypt
            var plaintext = new Uint8Array(vector.plaintext.byteLength + 1);
            plaintext.set(plaintext, 0);
            plaintext.set(new Uint8Array([32]), vector.plaintext.byteLength);
            promise_test(function(test) {
                return subtle.encrypt(vector.algorithm, vector.publicKey, plaintext)
                .then(function(ciphertext) {
                    assert_unreached("Should have thrown error for too long plaintext in " + vector.name + ": " + err.message + "'");
                }, function(err) {
                    assert_equals(err.name, "OperationError", "Should throw OperationError");
                });
            }, vector.name + " too long plaintext");

        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
            }, "importVectorKeys step: " + vector.name + " too long plaintext");
        });

        all_promises.push(promise);
    });


    // Check for failures due to using privateKey to encrypt.
    passingVectors.forEach(function(vector) {
        var promise = importVectorKeys(vector, ["verify"], ["sign"])
        .then(function(vectors) {
            promise_test(function(test) {
                return subtle.encrypt(vector.algorithm, vector.privateKey, vector.plaintext)
                .then(function(ciphertext) {
                    assert_unreached("Should have thrown error for using privateKey to encrypt in " + vector.name + ": " + err.message + "'");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw InvalidAccessError");
                });
            }, vector.name + " using privateKey to encrypt");

        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
            }, "importVectorKeys step: " + vector.name + " using privateKey to encrypt");
        });

        all_promises.push(promise);
    });


    // Check for failures due to no "encrypt usage".
    passingVectors.forEach(function(originalVector) {
        var vector = Object.assign({}, originalVector);

        var promise = importVectorKeys(vector, [], ["decrypt"])
        .then(function(vectors) {
            // Get a one byte longer plaintext to encrypt
            promise_test(function(test) {
                return subtle.encrypt(vector.algorithm, vector.publicKey, vector.plaintext)
                .then(function(ciphertext) {
                    assert_unreached("Should have thrown error for no encrypt usage in " + vector.name + ": " + err.message + "'");
                }, function(err) {
                    assert_equals(err.name, "InvalidAccessError", "Should throw InvalidAccessError");
                });
            }, vector.name + " no encrypt usage");

        }, function(err) {
            // We need a failed test if the importVectorKey operation fails, so
            // we know we never tested encryption
            promise_test(function(test) {
                assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
            }, "importVectorKeys step: " + vector.name + " no encrypt usage");
        });

        all_promises.push(promise);
    });

    Promise.all(all_promises)
    .then(function() {done();})
    .catch(function() {done();})

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
            });        // Returns a copy of the sourceBuffer it is sent.
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

    // Returns a copy of the sourceBuffer it is sent.
    function copyBuffer(sourceBuffer) {
        var source = new Uint8Array(sourceBuffer);
        var copy = new Uint8Array(sourceBuffer.byteLength)

        for (var i=0; i<source.byteLength; i++) {
            copy[i] = source[i];
        }

        return copy;
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
