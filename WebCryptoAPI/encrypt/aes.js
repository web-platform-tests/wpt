
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

    subtle.importKey("raw", keyBytes128, {name: "AES-GCM"}, false, ["encrypt"])
    .then(function(key128) {

        promise_test(function(test) {
            return subtle.encrypt({name: "AES-GCM", iv: iv256, additionalData: additionalData, tagLength: 128}, key128, plaintext)
            .then(function(result) {
                var ciphertextLength = result.byteLength - 16;
                var ciphertext = result.slice(0, ciphertextLength);
                var tag = result.slice(ciphertextLength);

                assert_true(equalBuffers(ciphertext, ciphertextGcm128), "Correct ciphertext");
                assert_true(equalBuffers(tag, tagGcm128), "Correct tag");
            })
            .catch(function(err) {
                assert_unreached("Threw an unexpected error: " + err.toString());
            });
        });

    }, function(err) {
        assert_unreached("Threw an unexpected error: " + err.toString());
    });

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

        return true;
        }
    }

    return;
}
