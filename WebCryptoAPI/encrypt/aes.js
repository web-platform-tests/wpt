
function run_test() {
    var subtle = crypto.subtle; // Change to test prefixed implementations

    // Test AES-CBC encryption with various key lengths for both successes
    // and appropriate errors.

    // Label tests with the parameters used for encrypt
    function parameterString(algorithm, keyLength, usages) {
        var result = "(" +
                        objectToString(algorithm) + ", " +
                        objectToString(keyLength) + ", " +
                        objectToString(usages) +
                     ")";

        return result;
    }

    // Source file aes_vectors.js provides the getTestVectors method
    // that drives these tests.
    getTestVectors().forEach(function(vector) {
        importVectorKey(vector)
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

    // A test vector has all needed fields for encryption, EXCEPT that the
    // key field is null. This function replaces that null with the Correct
    // CryptoKey object.
    //
    // Returns a Promise that yields an updated vector on success.
    function importVectorKey(vector) {
        return subtle.importKey("raw", vector.keyBuffer, {name: vector.algorithm.name}, false, ["encrypt"])
        .then(function(key) {
            vector.key = key;
            return vector;
        });
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
