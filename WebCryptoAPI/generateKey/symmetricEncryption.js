function run_test() {

    // API may not be available outside a secure context.
    if (!runningInASecureContext()) {
        test(function() {}, "No tests because API not available in insecure context");
        return;
    }


    // Good key generation parameters
    var goodSymmetricEncryptionAlgorithmNames = [
        "AES-CTR",
        "AES-CBC",
        "AES-GCM",
        "AES-CFB",
        "aEs-ctr",
        "aEs-cbc",
        "aEs-gcm",
        "aEs-cfb"
    ];

    var goodSymmetricEncryptionAlgorithmLengths = [
        128,
        192,
        256
    ];

    var goodExtractableParameters = [
        true,
        false
    ];

    var goodUsagesParameters = [
        ["encrypt"],
        ["decrypt"],
        ["wrapKey"],
        ["unwrapKey"],
        ["decrypt", "encrypt"],
        ["decrypt", "wrapKey"],
        ["decrypt", "unwrapKey"],
        ["encrypt", "wrapKey"],
        ["encrypt", "unwrapKey"],
        ["wrapKey", "unwrapKey"],
        ["decrypt", "encrypt", "wrapKey"],
        ["decrypt", "encrypt", "unwrapKey"],
        ["decrypt", "wrapKey", "unwrapKey"],
        ["encrypt", "wrapKey", "unwrapKey"],
        ["decrypt", "encrypt", "wrapKey", "unwrapKey"],
        ["encrypt", "unwrapKey", "decrypt", "unwrapKey"],
        ["encrypt", "unwrapKey", "decrypt", "unwrapKey", "decrypt", "decrypt"]
    ];

    goodSymmetricEncryptionAlgorithmNames.forEach(function(name) {
        goodSymmetricEncryptionAlgorithmLengths.forEach(function(length){
            goodExtractableParameters.forEach(function(extractable){
                goodUsagesParameters.forEach(function(usages){
                    var parameters =
                        '{name: "' + name + '", length: ' + length.toString() + '}, ' +
                        extractable.toString() + ', [' + usages.toString() + ']'

                    promise_test(function(test) {
                        return crypto.subtle.generateKey({name: name, length: length}, extractable, usages)
                        .then(function(result) {
                            assert_equals(result.constructor, CryptoKey, "Result is a CryptoKey");
                            assert_equals(result.type, "secret", "Is a secret key");
                            assert_equals(result.extractable, extractable, "Extractability is correct");
                            assert_equals(result.algorithm.name, name.toUpperCase(), "Correct algorithm name");
                            assert_equals(result.algorithm.length, length, "Correct algorithm length");

                            var usageCount = 0;
                            ["encrypt", "decrypt", "wrapKey", "unwrapKey"].forEach(function(usage) {
                                if (usages.includes(usage)) {
                                    usageCount += 1;
                                    assert_true(result.usages.includes(usage), "Has " + usage + " usage");
                                }
                            });
                            assert_equals(result.usages.length, usageCount, "usages property is correct");
                        });
                    }, "generateKey(" + parameters + ") ");
                });
            });
        });
    });

    // Now test for properly handling errors

    // Algorithm normalization should fail with "Not supported"
    var badSymmetricEncryptionAlgorithms = [
        "AES",
        {name: "AES"},
        {name: "AES", length: 128},
    ];

    badSymmetricEncryptionAlgorithms.forEach(function(algorithm) {
        goodExtractableParameters.forEach(function(extractable){
            goodUsagesParameters.forEach(function(usages){
                var algorithmString;

                if (typeof algorithm === "string") {
                    algorithmString = '"' + algorithm + '"';
                } else {
                    algorithmString = '{name: "' + algorithm.name + '"';
                    if ("length" in algorithm) {
                        algorithmString += ', length: ' + algorithm.length.toString() + '}';
                    } else {
                        algorithmString += '};'
                    }
                }

                var parameters =
                    algorithmString + ', ' +
                    extractable.toString() + ', [' + usages.toString() + ']'

                promise_test(function(test) {
                    return crypto.subtle.generateKey(algorithm, extractable, usages)
                    .then(function(result) {
                        assert_unreached("Operation succeeded, but should not have");
                    })
                    .catch(function(err) {
                        assert_equals(err.code, DOMException.NOT_SUPPORTED_ERR, "Bad algorithm not supported");
                    });
                }, "Bad algorithm: generateKey(" + parameters + ") ");
            });
        });
    });


    var badSymmetricEncryptionAlgorithmLengths = [
        64,
        127,
        257,
        512
    ];

    var invalidUsagesParameters = [
        [],
        ["DECRYPT"],
        ["decrypt", "DECRYPT"]
    ];
}
