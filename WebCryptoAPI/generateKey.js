function run_test() {
    // Good key generation parameters
    var goodSymmetricEncryptionAlgorithmNames = [
        "AES-CTR",
        "AES-CBC",
        "AES-GCM",
        "AES-CFB",
        "aes-CTR",
        "aes-CBC",
        "aes-GCM",
        "aes-CFB",
        "AES-ctr",
        "AES-cbc",
        "AES-gcm",
        "AES-cfb"
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
        ["decrypt", "encrypt"],
        ["encrypt", "decrypt"]
    ];

    var secure;
    if ("isSecureContext" in this) {
        secure = isSecureContext;
    } else {
        // TODO: address localhost equivalents
        secure = ["https:", "wss:", "file:"].includes(location.protocol);
    }

    goodSymmetricEncryptionAlgorithmNames.forEach(function(name) {
        goodSymmetricEncryptionAlgorithmLengths.forEach(function(length){
            var algorithm = {name: name, length: length};

            goodExtractableParameters.forEach(function(extractable){
                goodUsagesParameters.forEach(function(usages){
                    var parameters =
                        '{name: "' + algorithm.name + '", length: ' + algorithm.length.toString() + '}, ' +
                        extractable.toString() + ', [' + usages.toString() + ']'

                    if (secure) {
                        promise_test(function(test) {
                            return crypto.subtle.generateKey(algorithm, extractable, usages)
                            .then(function(result) {
                                assert_equals(result.constructor, CryptoKey, "Result is a CryptoKey");
                                assert_equals(result.type, "secret", "Is a secret key");

                                assert_readonly(result, "type",         "type property is readonly");
                                assert_readonly(result, "extractable",  "extractable property is readonly");

                                // assert_readonly does not work for object properties, because
                                // the values of the properties may be created from the
                                // underlying implementation whenever referenced. Thus,
                                // result.algorithm === result.algorithm could be false.
                                // So we do a rougher check for readonly.
                                result.algorithm = "Changed";
                                assert_equals(result.algorithm.name.toLowerCase(),  algorithm.name.toLowerCase(),   "algorithm property is readonly");
                                assert_equals(result.algorithm.length,              algorithm.length,               "algorithm property is readonly");

                                result.usages = "Changed";
                                assert_equals(result.usages.length, usages.length, "usages property is readonly");
                            });
                        }, "Successful generateKey (" + parameters + ") ");
                    } else {
                        promise_test(function(test) {
                            return crypto.subtle.generateKey(algorithm, extractable, usages)
                            .then(function(result) {
                                assert_unreached("Should not resolve in insecure contexts");
                            })
                            .catch(function(err) {
                                assert_true(err.message.includes("secure"), "Error due to context security");
                            });
                        }, "Insecure context error thrown for generateKey (" + parameters + ") ");
                    }
                });
            });
        });
    });

}
