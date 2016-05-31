
function run_test() {
    var subtle = crypto.subtle; // Change to test prefixed implementations

    // Source file aes_vectors.js provides the getTestVectors method
    // that drives these tests.
    getTestVectors().forEach(function(vector) {
        importVectorKey(vector, ["encrypt"])
        .then(function(vector) {
            promise_test(function(test) {
                return subtle.encrypt(vector.algorithm, vector.key, vector.plaintext)
                .then(function(result) {
                    assert_true(equalBuffers(result, vector.result), "Should return expected result");
                }, function(err) {
                    assert_unreached("encrypt error for test " + vector.name + ": " + err.message);
                });
            }, vector.name);

            // Try bad tagLengths. In order to not repeat, trigger them only for
            // vectors with the largest possible tagLength. Try tags that are
            // too long, too short, and an unallowed middle value.
            if (vector.algorithm.tagLength === 128) {
                [132, 28, 100].forEach(function(badTagLength) {
                    var algorithm = Object.assign({}, vector.algorithm);
                    algorithm.tagLength = badTagLength;

                    promise_test(function(test) {
                        return subtle.encrypt(algorithm, vector.key, vector.plaintext)
                        .then(function(result) {
                            assert_unreached("Bad tag length " + badTagLength.toString + " should have thrown error");
                        }, function(err) {
                            assert_equals(err.name, "OperationError", "Should have thrown an OperationError")
                        });
                    }, vector.name + " with " + badTagLength + "-bit tag");
                });
            }

            // Should also test bad plaintext, iv, and additionalData lengths.
            // But it's not realistic to generate buffers of more than 2^39,
            // 2^64, and 2^64 bytes, so no such tests.

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
