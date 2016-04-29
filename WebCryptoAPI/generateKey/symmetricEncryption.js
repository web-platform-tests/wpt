function run_test() {
    // API may not be available outside a secure context.
    if (!runningInASecureContext()) {
        test(function() {}, "No tests because API not necessarily available in insecure context");
        return;
    }

    var subtle = crypto.subtle; // Change to test prefixed implementations

// These tests first check that generateKey successfully creates keys
// when provided any of a wide set of correct parameters. They then check
// that it throws an error, and that the error is of the right type, for
// a wide set of incorrect parameters.
//
// Error testing occurs by setting the parameter that should trigger the
// error to an invalid value, then combining that with all valid
// parameters that should be checked earlier by generateKey, and all
// valid and invalid parameters that should be checked later by
// generateKey.
//
// There are a lot of combinations of possible parameters for both
// success and failure modes, resulting in a very large number of tests
// performed.


// Setup: define the correct behaviors that should be sought, and create
// helper functions that generate all possible test parameters for
// different situations.

    var testVectors = [ // Parameters that should work for generateKey
        {name: "AES-CTR",  resultType: CryptoKey, usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"], mandatoryUsages: []},
        {name: "AES-CBC",  resultType: CryptoKey, usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"], mandatoryUsages: []},
        {name: "AES-GCM",  resultType: CryptoKey, usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"], mandatoryUsages: []},
        {name: "AES-KW",   resultType: CryptoKey, usages: ["wrapKey", "unwrapKey"], mandatoryUsages: []},
        {name: "HMAC",     resultType: CryptoKey, usages: ["sign", "verify"], mandatoryUsages: []},
        {name: "RSASSA-PKCS1-v1_5", resultType: "CryptoKeyPair", usages: ["sign", "verify"], mandatoryUsages: ["sign"]},
        {name: "RSA-PSS",  resultType: "CryptoKeyPair", usages: ["sign", "verify"], mandatoryUsages: ["sign"]}
    ];

    // Create a string representation of keyGeneration parameters for
    // test names and labels.

    function objectToString(obj) {
        var keyValuePairs = [];

        if (Array.isArray(obj)) {
            return "[" + obj.map(function(elem){return objectToString(elem);}).join(", ") + "]";
        } else if (typeof obj === "object") {
            Object.keys(obj).sort().forEach(function(keyName) {
                keyValuePairs.push(keyName + ": " + objectToString(obj[keyName]));
            });
            return "{" + keyValuePairs.join(", ") + "}";
        } else if (typeof obj === "undefined") {
            return "undefined";
        } else {
            return obj.toString();
        }

        var keyValuePairs = [];

        Object.keys(obj).sort().forEach(function(keyName) {
            var value = obj[keyName];
            if (typeof value === "object") {
                value = objectToString(value);
            } else if (typeof value === "array") {
                value = "[" + value.map(function(elem){return objectToString(elem);}).join(", ") + "]";
            } else {
                value = value.toString();
            }

            keyValuePairs.push(keyName + ": " + value);
        });

        return "{" + keyValuePairs.join(", ") + "}";
    }

    function parameterString(algorithm, extractable, usages) {
        if (typeof algorithm !== "object" && typeof algorithm !== "string") {
            alert(algorithm);
        }

        var result = "(" +
                        objectToString(algorithm) + ", " +
                        objectToString(extractable) + ", " +
                        objectToString(usages) +
                     ")";

        return result;
    }

    // Test that a given combination of parameters is successful
    function testSuccess(algorithm, extractable, usages, resultType, testTag) {
        promise_test(function(test) {
            return crypto.subtle.generateKey(algorithm, extractable, usages)
            .then(function(result) {
                if (resultType === "CryptoKeyPair") {
                    assert_equals(result.publicKey.constructor, CryptoKey, "Public key is a CryptoKey");
                    assert_equals(result.privateKey.constructor, CryptoKey, "Private key is a CryptoKey");
                    assert_equals(result.publicKey.type, "public", "Is a public key");
                    assert_equals(result.privateKey.type, "private", "Is a private key");
                    assert_equals(result.publicKey.extractable, true, "Public key is always extractable");
                    assert_equals(result.privateKey.extractable, extractable, "Private key extractability is correct");
                } else {
                    assert_equals(result.constructor, resultType, "Result is a " + resultType.toString());
                    assert_equals(result.type, "secret", "Is a secret key");
                    assert_equals(result.extractable, extractable, "Extractability is correct");

                    assert_equals(result.algorithm.name, algorithm.name.toUpperCase(), "Correct algorithm name");
                    assert_equals(result.algorithm.length, algorithm.length, "Correct length");
                    if (algorithm.name === "HMAC") {
                        assert_equals(result.algorithm.hash.name, algorithm.hash.name.toUpperCase(), "Correct hash function");
                    }
                    // The usages parameter could have repeats, but the usages
                    // property of the result should not.
                    var usageCount = 0;
                    result.usages.forEach(function(usage) {
                        usageCount += 1;
                        assert_in_array(usage, usages, "Has " + usage + " usage");
                    });
                    assert_equals(result.usages.length, usageCount, "usages property is correct");
                }
            })
            .catch(function(err) {
                assert_unreached("Threw an unexpected error: " + err.toString());
            });
        }, testTag + ": generateKey" + parameterString(algorithm, extractable, usages));
    }

    // Test that a given combination of parameters results in an error,
    // AND that it is the correct kind of error.
    //
    // Expected error is either a number, tested against the error code,
    // or a string, tested against the error name.
    function testError(algorithm, extractable, usages, expectedError, testTag) {
        promise_test(function(test) {
            return crypto.subtle.generateKey(algorithm, extractable, usages)
            .then(function(result) {
                assert_unreached("Operation succeeded, but should not have");
            })
            .catch(function(err) {
                if (typeof expectedError === "number") {
                    assert_equals(err.code, expectedError, testTag + " not supported");
                } else {
                    assert_equals(err.name, expectedError, testTag + " not supported");
                }
            });
        }, testTag + ": generateKey" + parameterString(algorithm, extractable, usages));
    }

    // The algorithm parameter is an object with a name and other
    // properties. Given the name, generate all valid parameters.
    function allAlgorithmSpecifiersFor(algorithmName) {
        var results = [];

        if (algorithmName.toUpperCase().substring(0, 3) === "AES") {
            // Specifier properties are name and length
            [128, 192, 256].forEach(function(length) {
                results.push({name: algorithmName, length: length});
            });
        } else if (algorithmName.toUpperCase() === "HMAC") {
            [
                {name: "SHA-1", length: 160},
                {name: "SHA-256", length: 256},
                {name: "SHA-384", length: 384},
                {name: "SHA-512", length: 512}
            ].forEach(function(hashAlgorithm) {
                results.push({name: algorithmName, hash: {name: hashAlgorithm.name}, length: hashAlgorithm.length});
            });
        } else if (algorithmName === "RSASSA-PKCS1-v1_5" || algorithmName === "RSA-PSS") {
            ["SHA-1", "SHA-256", "SHA-384", "SHA-512"].forEach(function(hashName) {
                [1024, 2048, 3072, 4096].forEach(function(modulusLength) {
                    [new Uint8Array([3]), new Uint8Array([1,0,1])].forEach(function(publicExponent) {
                        results.push({name: algorithmName, hash: hashName, modulusLength: modulusLength, publicExponent: publicExponent});
                    });
                });
            });
        }

        return results;
    }

    // Given an algorithm name, create several invalid parameters.
    function badAlgorithmPropertySpecifiersFor(algorithmName) {
        var results = [];

        if (algorithmName.toUpperCase().substring(0, 3) === "AES") {
            // Specifier properties are name and length
            [64, 127, 129, 255, 257, 512].forEach(function(length) {
                results.push({name: algorithmName, length: length});
            });
        } else if (algorithmName.toUpperCase() === "HMAC") {
            [
                {name: "SHA-1", length: 256},
                {name: "SHA-256", length: 160},
                {name: "SHA-384", length: 512},
                {name: "SHA-512", length: 384}
            ].forEach(function(hashAlgorithm) {
                results.push({name: algorithmName, hash: {name: hashAlgorithm.name}, length: hashAlgorithm.length});
            });
        }

        return results;
    }

    // Create every possible valid usages parameter, given legal
    // usages. Note that an empty usages parameter is not always valid.
    //
    // There is an optional parameter - mandatoryUsages. If provided,
    // it should be an array containing those usages that must be
    // included. For example, when generating an RSA-PSS key pair,
    // both "sign" and "verify" are possible usages, but if "verify"
    // is not included in the usages, the private key will end up
    // with an empty set of usages, causing a Syntax Error.
    function allValidUsages(validUsages, emptyIsValid, mandatoryUsages) {
        var optionalUsages = [];
        if (typeof mandatoryUsages === "undefined") {
            mandatoryUsages = [];
        }

        validUsages.forEach(function(usage) {
            if (!mandatoryUsages.includes(usage)) {
                optionalUsages.push(usage);
            }
        });

        var subsets = allNonemptySubsetsOf(optionalUsages).map(function(subset) {
             return subset.concat(mandatoryUsages);
        });

        if (emptyIsValid) {
            subsets.push([]);
        }

        subsets.push(mandatoryUsages.concat(mandatoryUsages).concat(optionalUsages)); // Repeated values are allowed
        return subsets;
    }

    // There are six possible usages values overall. Create all those
    // combinations that are illegal for a specific algorithm.
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

    // Algorithm name specifiers are case-insensitive. Generate several
    // case variations of a given name.
    function allNameVariants(name) {
        var upCaseName = name.toUpperCase();
        var lowCaseName = name.toLowerCase();
        var mixedCaseName = upCaseName.substring(0, 1) + lowCaseName.substring(1);

        return [upCaseName, lowCaseName, mixedCaseName];
    }



// The happy paths. Test all valid sets of parameters for successful
// key generation.
    testVectors.forEach(function(vector) {
        allNameVariants(vector.name).forEach(function(name) {
            allAlgorithmSpecifiersFor(name).forEach(function(algorithm) {
                allValidUsages(vector.usages, false, vector.mandatoryUsages).forEach(function(usages) {
                    [false, true].forEach(function(extractable) {
                        testSuccess(algorithm, extractable, usages, vector.resultType, "Success");
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
    var badAlgorithmNames = [
        "AES",
        {name: "AES"},
        {name: "AES", length: 128},
        {name: "AES-CMAC", length: 128},    // Removed after CR
        {name: "AES-CFB", length: 128},      // Removed after CR
        {name: "HMAC", hash: {name: "MD5", length: 128}},
        {name: "HMAC", hash: {name: "SHA", length: 160}},
        {name: "HMAC", hash: "MD5"}
    ];

    // Algorithm normalization failures should be found first
    // - all other parameters can be good or bad, should fail
    //   due to NOT_SUPPORTED_ERR
    badAlgorithmNames.forEach(function(algorithm) {
        allValidUsages(["encrypt", "decrypt", "sign", "verify", "wrapKey", "unwrapKey"], false).concat([[]])
        .forEach(function(usages) {
            [false, true, "RED", 7].forEach(function(extractable){
                testError(algorithm, extractable, usages, DOMException.NOT_SUPPORTED_ERR, "Bad algorithm");
            });
        });
    });

    // Algorithms normalize okay, but usages bad (though not empty)
    testVectors.forEach(function(vector) {
        var name = vector.name;

        // Algorithm normalization should succeed, even if
        // there's a bad property (like length), so try all
        // good and bad property combinations. Then check
        // the first possible next error: bad usages.
        allAlgorithmSpecifiersFor(name).concat(badAlgorithmPropertySpecifiersFor(name))
        .forEach(function(algorithm) {
            allInvalidUsages(vector.usages, false).forEach(function(usages) {
                [false, true, "RED", 7].forEach(function(extractable) {
                    testError(algorithm, extractable, usages, DOMException.SYNTAX_ERR, "Bad usages");
                });
            });
        });
    });

    // Other algorithm properties should be checked next, so try good
    // algorithm names and usages, but bad algorithm properties next.
    // - Special case: normally bad usage [] isn't checked until after properties,
    //   so it's included in this test case
    testVectors.forEach(function(vector) {
        var name = vector.name;
        badAlgorithmPropertySpecifiersFor(name).forEach(function(algorithm) {
            allValidUsages(vector.usages, false).concat([[]])
            .forEach(function(usages) {
                [false, true, "RED", 7].forEach(function(extractable) {
                    testError(algorithm, extractable, usages, "OperationError", "Bad algorithm property");
                });
            });
        });
    });

    // The last thing that should be checked is an empty usages (for secret keys).
    testVectors.forEach(function(vector) {
        var name = vector.name;

        allAlgorithmSpecifiersFor(name).forEach(function(algorithm) {
            var usages = [];
            [false, true].forEach(function(extractable) {
                testError(algorithm, extractable, usages, DOMException.SYNTAX_ERR, "Empty usages");
            });
        });
    });


}
