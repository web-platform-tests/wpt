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
        {name: "AES-GCM",  resultType: CryptoKey, usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"]},
        {name: "AES-KW",   resultType: CryptoKey, usages: ["wrapKey", "unwrapKey"]}
    ];

    function allAlgorithmSpecifiersFor(algorithmName) {
        var results = [];

        if (algorithmName.toUpperCase().substring(0, 3) === "AES") {
            // Specifier properties are name and length
            [128, 192, 256].forEach(function(length) {
                results.push({name: algorithmName, length: length});
            });

        return results;
        }
    }

    function badAlgorithmLengthSpecifiersFor(algorithmName) {
        var results = [];

        if (algorithmName.toUpperCase().substring(0, 3) === "AES") {
            // Specifier properties are name and length
            [64, 127, 129, 255, 257, 512].forEach(function(length) {
                results.push({name: algorithmName, length: length});
            });

        return results;
        }
    }

    // Returns a list of lists of all valid usages (order
    // or list members is not guaranteed).
    //
    // Provide all possible usages, and whether the empty set is valid
    function allValidUsages(validUsages, emptyIsValid) {
        var subsets = allNonemptySubsetsOf(validUsages);
        if (emptyIsValid) {
            subsets.push([]);
        }

        subsets.push(validUsages.concat(validUsages)); // Repeated values are allowed
        return subsets;
    }

    // Essentially the inverse of allValidUsages. However, it only
    // returns usage sets consisting of potentially valid usages,
    // it does not return usages arrays include random strings, for example.
    function allInvalidUsages(validUsages, emptyIsValid) {
        var universe = allNonemptySubsetsOf(["encrypt", "decrypt", "sign", "verify", "wrapKey", "unwrapKey"]);

        var results = [];
        if (!emptyIsValid) {
            results.push([]);
        }

        universe.forEach(function(subset) {
            if (!subset.every(function(elem) {return validUsages.includes(elem);})) {
                results.push(subset);
            }
        });

        return results;
    }


    // Try all the paths that should succeed.
    goodTestVectors.forEach(function(vector) {
        var upCaseName = vector.name;
        var lowCaseName = vector.name.toLowerCase();
        var mixedCaseName = upCaseName.substring(0, 1) + lowCaseName.substring(1);

        [upCaseName, lowCaseName, mixedCaseName].forEach(function(name) {
            allAlgorithmSpecifiersFor(name).forEach(function(algorithm) {
                allValidUsages(vector.usages, false).forEach(function(usages) {
                    [false, true].forEach(function(extractable) {

                        var parameters =
                            '{name: "' + algorithm.name + '", length: ' + algorithm.length.toString() + '}, ' +
                            extractable.toString() + ', [' + usages.toString() + ']';

                        promise_test(function(test) {
                            return crypto.subtle.generateKey(algorithm, extractable, usages)
                            .then(function(result) {
                                assert_equals(result.constructor, CryptoKey, "Result is a CryptoKey");
                                assert_equals(result.type, "secret", "Is a secret key");
                                assert_equals(result.extractable, extractable, "Extractability is correct");
                                assert_equals(result.algorithm.name, algorithm.name.toUpperCase(), "Correct algorithm name");
                                assert_equals(result.algorithm.length, algorithm.length, "Correct length");

                                var usageCount = 0;
                                vector.usages.forEach(function(usage) {
                                    if (usages.includes(usage)) {
                                        usageCount += 1;
                                        assert_in_array(usage, result.usages, "Has " + usage + " usage");
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
    // - Unsupported algorithm
    // - Bad usages for algorithm
    // - Bad key lengths

    // Algorithm normalization should fail with "Not supported"
    var badSymmetricEncryptionAlgorithms = [
        "AES",
        {name: "AES"},
        {name: "AES", length: 128},
        {name: "AES-CMAC", length: 128},    // Removed after CR
        {name: "AES-CFB", length: 128}      // Removed after CR
    ];

    // Algorithm normalization failures should be found first
    // - all other parameters can be good or bad, should fail due to normalization
    badSymmetricEncryptionAlgorithms.forEach(function(algorithm) {
        allValidUsages(["encrypt", "decrypt", "sign", "verify"], false)
        .concat([[]])
        .forEach(function(usages) {
            [false, true, "RED", 7].forEach(function(extractable){
                var algorithmString;

                if (typeof algorithm === "string") {
                    algorithmString = '"' + algorithm + '"';
                } else {
                    algorithmString = '{name: "' + algorithm.name + '"';
                    if ("length" in algorithm) {
                        algorithmString += ', length: ' + algorithm.length.toString() + '}';
                    } else {
                        algorithmString += '};';
                    }
                }

                var parameters =
                    algorithmString + ', ' +
                    extractable.toString() + ', [' + usages.toString() + ']';

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

    // Algorithms okay, but usages bad (though not empty)
    goodTestVectors.forEach(function(vector) {
        var name = vector.name;

        allAlgorithmSpecifiersFor(name)
        .concat(badAlgorithmLengthSpecifiersFor(name))
        .forEach(function(algorithm) {
            allInvalidUsages(vector.usages, false).forEach(function(usages) {
                [false, true, "RED", 7].forEach(function(extractable) {

                    var parameters =
                        '{name: "' + algorithm.name + '", length: ' + algorithm.length.toString() + '}, ' +
                        extractable.toString() + ', [' + usages.toString() + ']';

                    promise_test(function(test) {
                        return crypto.subtle.generateKey(algorithm, extractable, usages)
                        .then(function(result) {
                            assert_unreached("Operation succeeded, but should not have");
                        })
                        .catch(function(err) {
                            assert_equals(err.code, DOMException.SYNTAX_ERR, "Bad usages");
                        });
                    }, "Bad usages: generateKey(" + parameters + ") ");

                });
            });
        });
    });

    // Length should be checked if algorithm normalization and usages succeed
    // - Special case: normally bad usage [] isn't checked until after length,
    //   so it's included in this test case
    goodTestVectors.forEach(function(vector) {
        var name = vector.name;
        badAlgorithmLengthSpecifiersFor(name).forEach(function(algorithm) {
            allValidUsages(vector.usages, false)
            .concat([[]])
            .forEach(function(usages) {
                [false, true, "RED", 7].forEach(function(extractable) {
                    var parameters =
                        '{name: "' + algorithm.name + '", length: ' + algorithm.length.toString() + '}, ' +
                        extractable.toString() + ', [' + usages.toString() + ']';

                    promise_test(function(test) {
                        return crypto.subtle.generateKey(algorithm, extractable, usages)
                        .then(function(result) {
                            assert_unreached("Operation succeeded, but should not have");
                        })
                        .catch(function(err) {
                            assert_equals(err.name, "OperationError", "Bad length should be an OperationError");
                        });
                    }, "Bad length: generateKey(" + parameters + ") ");
                });
            });
        });
    });

    // The last thing that should be checked is an empty usages (for secret keys).
    goodTestVectors.forEach(function(vector) {
        var name = vector.name;

        allAlgorithmSpecifiersFor(name).forEach(function(algorithm) {
            var usages = [];
            [false, true].forEach(function(extractable) {

            var parameters =
                '{name: "' + algorithm.name + '", length: ' + algorithm.length.toString() + '}, ' +
                extractable.toString() + ', [' + usages.toString() + ']';

                promise_test(function(test) {
                    return crypto.subtle.generateKey(algorithm, extractable, usages)
                    .then(function(result) {
                        assert_unreached("Operation succeeded, but should not have");
                    })
                    .catch(function(err) {
                        assert_equals(err.code, DOMException.SYNTAX_ERR, "Empty usages");
                    });
                }, "Empty usages: generateKey(" + parameters + ") ");
            });
        });
    });


}
