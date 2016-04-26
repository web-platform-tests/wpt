function run_test() {
    // API may not be available outside a secure context.
    if (!runningInASecureContext()) {
        test(function() {}, "No tests because API not necessarily available in insecure context");
        return;
    }

    var subtle = crypto.subtle; // Change to test prefixed implementations

    var goodTestVectors = [ // Parameters that should work for generateKey
        {name: "AES-CTR",  resultType: CryptoKey, usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"]},
        {name: "AES-CBC",  resultType: CryptoKey, usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"]},
        {name: "AES-CMAC", resultType: CryptoKey, usages: ["sign", "verify"]},
        {name: "AES-GCM",  resultType: CryptoKey, usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"]},
        {name: "AES-CFB",  resultType: CryptoKey, usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"]},
        {name: "AES-KW",   resultType: CryptoKey, usages: ["wrapKey", "unwrapKey"]}
    ];

    function allAlgorithmSpecifiersFor(algorithmName) {
        var results = [];

        if (algorithmName.toUpperCase().substring(0, 4) === "AES-") {
            // Specifier properties are name and length
            [128, 192, 256].forEach(function(length) {
                results.push({name: algorithmName, length: length});
            });

        return results;
        }
    }

    function allUsageCombinationsOf(validUsages) {
        var results = [];
        var firstUsage;
        var remainingUsages;

        for(var i=0; i<validUsages.length; i++) {
            firstUsage = validUsages[i];
            remainingUsages = validUsages.slice(i+1);
            results.push([firstUsage]);
            results.push([firstUsage, firstUsage]); // Repeats should be allowed

            if (remainingUsages.length > 0) {
                allUsageCombinationsOf(remainingUsages).forEach(function(combination) {
                    combination.push(firstUsage);
                    results.push(combination);
                });
            }
        }

        return results;
    }

    goodTestVectors.forEach(function(vector) {
        var upCaseName = vector.name;
        var lowCaseName = vector.name.toLowerCase();
        var mixedCaseName = upCaseName.substring(0, 1) + lowCaseName.substring(1);

        [upCaseName, lowCaseName, mixedCaseName].forEach(function(name) {
            allAlgorithmSpecifiersFor(name).forEach(function(algorithm) {
                allUsageCombinationsOf(vector.usages).forEach(function(usages) {
                    [false, true].forEach(function(extractable) {

                        var parameters =
                            '{name: "' + algorithm.name + '", length: ' + algorithm.length.toString() + '}, ' +
                            extractable.toString() + ', [' + usages.toString() + ']'

                        promise_test(function(test) {
                            return crypto.subtle.generateKey(algorithm, extractable, usages)
                            .then(function(result) {
                                assert_equals(result.constructor, CryptoKey, "Result is a CryptoKey");
                                assert_equals(result.type, "secret", "Is a secret key");
                                assert_equals(result.extractable, extractable, "Extractability is correct");
                                assert_equals(result.algorithm.name, algorithm.name.toUpperCase(), "Correct algorithm name");

                                var usageCount = 0;
                                vector.usages.forEach(function(usage) {
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
    });

    // Now test for properly handling errors

    // Algorithm normalization should fail with "Not supported"
    var badSymmetricEncryptionAlgorithms = [
        "AES",
        {name: "AES"},
        {name: "AES", length: 128}
    ];

    badSymmetricEncryptionAlgorithms.forEach(function(algorithm) {
        allUsageCombinationsOf(["encrypt", "decrypt", "sign", "verify"]).forEach(function(usages) {
            [false, true].forEach(function(extractable){
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

// How about some bad usages?

    goodTestVectors.forEach(function(vector) {
        var name = vector.name;

        allAlgorithmSpecifiersFor(name).forEach(function(algorithm) {
            allUsageCombinationsOf(vector.usages).forEach(function(usages) {
                usages.push("encrypt", "sign"); // No algorithms support both
                [false, true].forEach(function(extractable) {

                    var parameters =
                        '{name: "' + algorithm.name + '", length: ' + algorithm.length.toString() + '}, ' +
                        extractable.toString() + ', [' + usages.toString() + ']'

                    promise_test(function(test) {
                        return crypto.subtle.generateKey(algorithm, extractable, usages)
                        .then(function(result) {
                            assert_unreached("Operation succeeded, but should not have");
                        })
                        .catch(function(err) {
                            assert_equals(err.code, DOMException.SYNTAX_ERR, "Bad algorithm not supported");
                        });
                    }, "Bad usages generateKey(" + parameters + ") ");

                });
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
