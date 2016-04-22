function run_test() {
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

    if (runningInASecureContext()) {
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
    } else {
        test(function() {}, "No tests because API not available in insecure context");
    }
}
