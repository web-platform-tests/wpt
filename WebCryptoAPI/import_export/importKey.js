
function run_test() {
    var subtle = crypto.subtle;

    var rawAesKeyData = [
        new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
        new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
                        17, 18, 19, 20, 21, 22, 23, 24]),
        new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
                        17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32])
    ];

    var aesTestVectors = [
        {name: "AES-CTR", legalUsages: ["encrypt", "decrypt"], extractable: [true, false], formats: ["raw", "jwk"]},
        {name: "AES-CBC", legalUsages: ["encrypt", "decrypt"], extractable: [true, false], formats: ["raw", "jwk"]},
        {name: "AES-GCM", legalUsages: ["encrypt", "decrypt"], extractable: [true, false], formats: ["raw", "jwk"]},
        {name: "AES-KW",  legalUsages: ["wrapKey", "unwrapKey"], extractable: [true, false], formats: ["raw", "jwk"]},
        {name: "HMAC",  hash: "SHA-1", legalUsages: ["sign", "verify"], extractable: [false], formats: ["raw", "jwk"]},
        {name: "HMAC",  hash: "SHA-256", legalUsages: ["sign", "verify"], extractable: [false], formats: ["raw", "jwk"]},
        {name: "HMAC",  hash: "SHA-384", legalUsages: ["sign", "verify"], extractable: [false], formats: ["raw", "jwk"]},
        {name: "HMAC",  hash: "SHA-512", legalUsages: ["sign", "verify"], extractable: [false], formats: ["raw", "jwk"]},
        {name: "HKDF",  legalUsages: ["deriveBits", "deriveKey"], extractable: [false], formats: ["raw"]},
        {name: "PBKDF2",  legalUsages: ["deriveBits", "deriveKey"], extractable: [false], formats: ["raw"]}
    ];

    function parameterString(format, data, algorithm, extractable, usages) {
        var result = "(" +
                        objectToString(format) + ", " +
                        objectToString(data) + ", " +
                        objectToString(algorithm) + ", " +
                        objectToString(extractable) + ", " +
                        objectToString(usages) +
                     ")";

        return result;
    }

    function byteArrayToUnpaddedBase64(byteArray){
        var binaryString = "";
        for (var i=0; i<byteArray.byteLength; i++){
            binaryString += String.fromCharCode(byteArray[i]);
        }
        var base64String = window.btoa(binaryString);

        return base64String.replace(/=/g, "");
    }

    function allNonemptySubsetsOf(arr) {
        var results = [];
        var firstElement;
        var remainingElements;

        for(var i=0; i<arr.length; i++) {
            firstElement = arr[i];
            remainingElements = arr.slice(i+1);
            results.push([firstElement]);

            if (remainingElements.length > 0) {
                allNonemptySubsetsOf(remainingElements).forEach(function(combination) {
                    combination.push(firstElement);
                    results.push(combination);
                });
            }
        }

        return results;
    }

    function jwkData(keyData, algorithm) {
        var result = {
            kty: "oct",
            k: byteArrayToUnpaddedBase64(keyData)
        };

        if (algorithm.name.substring(0, 3) === "AES") {
            result.alg = "A" + (8 * keyData.byteLength).toString() + algorithm.name.substring(4);
        } else if (algorithm.name === "HMAC") {
            result.alg = "HS" + algorithm.hash.substring(4);
        }
        return result;
    }

    function allValidUsages(possibleUsages, requiredUsages) {
        var allUsages = [];

        allNonemptySubsetsOf(possibleUsages).forEach(function(usage) {
            for (var i=0; i<requiredUsages.length; i++) {
                if (!usage.includes(requiredUsages[i])) {
                    return;
                }
            }
            allUsages.push(usage);
        });

        return allUsages;
    }

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

    function equalJwk(expected, got) {
        var fields = Object.keys(expected);
        var fieldName;

        for(var i=0; i<fields.length; i++) {
            fieldName = fields[i];
            if (!(fieldName in got)) {
                return false;
            }
            if (expected[fieldName] !== got[fieldName]) {
                return false;
            }
        }

        return true;
    }

    aesTestVectors.forEach(function(vector) {
        var algorithm = {name: vector.name};
        if ("hash" in vector) {
            algorithm.hash = vector.hash;
        }

        rawAesKeyData.forEach(function(keyData) {
            allValidUsages(vector.legalUsages, []).forEach(function(usages) {
                vector.extractable.forEach(function(extractable) {
                    var data;

                    // Test raw format first
                    if (vector.formats.includes("raw")) {
                        promise_test(function(test) {
                            return subtle.importKey("raw", keyData, algorithm, extractable, usages).
                            then(function(key) {
                                assert_equals(key.constructor, CryptoKey, "Imported a CryptoKey object");
                                if (!extractable) {
                                    return;
                                }
                                return subtle.exportKey("raw", key).
                                then(function(bytes) {
                                    assert_true(equalBuffers(keyData, bytes), "Round trip works");
                                }, function(err) {
                                    assert_unreached("Threw an unexpected error: " + err.toString());
                                });
                            }, function(err) {
                                assert_unreached("Threw an unexpected error: " + err.toString());
                            });
                        }, "Good parameters: " + (8 * keyData.byteLength).toString() + " bits " + parameterString("raw", keyData.byteLength.toString() + " byte buffer", algorithm, extractable, usages));
                    }

                    // Test jwk format next

                    if (vector.formats.includes("jwk")) {
                        data = jwkData(keyData, algorithm);
                        promise_test(function(test) {
                            return subtle.importKey("jwk", data, algorithm, extractable, usages).
                            then(function(key) {
                                assert_equals(key.constructor, CryptoKey, "Created a CryptoKey");
                                if (!extractable) {
                                    return;
                                }
                                return subtle.exportKey("jwk", key).
                                then(function(exported) {
                                    //assert_true(equalBuffers(keyData, bytes), "Round trip works");
                                    assert_true(equalJwk(data, exported), "Round trip works");
                                }, function(err) {
                                    assert_unreached("Threw an unexpected error: " + err.toString());
                                });
                            }, function(err) {
                                assert_unreached("Threw an unexpected error: " + err.toString());
                            });
                        }, "Good parameters: " + (8 * keyData.byteLength).toString() + " bits " + parameterString("jwk", data, algorithm, extractable, usages));
                    }
                });
            });

        });
    });

}
