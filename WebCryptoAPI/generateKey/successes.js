function run_test() {
    // API may not be available outside a secure context.
    if (!runningInASecureContext()) {
        test(function() {}, "No tests because API not necessarily available in insecure context");
        return;
    }

    var subtle = crypto.subtle; // Change to test prefixed implementations

    setup({explicit_timeout: true});

// These tests check that generateKey successfully creates keys
// when provided any of a wide set of correct parameters.
//
// There are a lot of combinations of possible parameters,
// resulting in a very large number of tests
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
        } else if (algorithmName.toUpperCase() === "RSASSA-PKCS1-V1_5" || algorithmName.toUpperCase() === "RSA-PSS") {
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

}
