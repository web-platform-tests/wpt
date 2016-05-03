//
// helpers.js
//
// Helper functions used by several WebCryptoAPI tests
//

function runningInASecureContext() {
    var protocol = location.protocol.toLowerCase();
    var hostname = location.hostname.toLowerCase();

    if (["https:", "wss:", "file:"].includes(protocol)) {
        return true;
    }

    if (hostname === "localhost") {
        return true;
    }

    if (/^127\.\d+\.\d+\.\d+$/.test(hostname)) {
        return true;
    }

    if (/^(0:){7}1$/.test(hostname) || /^::1$/.test(hostname)) {
        return true;
    }

    return false;
}


// Treats an array as a set, and generates an array of all non-empty
// subsets (which are themselves arrays).
//
// The order of members of the "subsets" is not guaranteed.
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

// Is key a CryptoKey object with correct algorithm, extractable, and usages?
// Is it a secret, private, or public kind of key?
function assert_goodCryptoKey(key, algorithm, extractable, usages, kind) {
    var correctUsages = [];

    var registeredAlgorithmName;
    ["AES-CTR", "AES-CBC", "AES-GCM", "AES-KW", "HMAC", "RSASSA-PKCS1-v1_5", "RSA-PSS"].forEach(function(name) {
        if (name.toUpperCase() === algorithm.name.toUpperCase()) {
            registeredAlgorithmName = name;
        }
    });

    assert_equals(key.constructor, CryptoKey, "Is a CryptoKey");
    assert_equals(key.type, kind, "Is a " + kind + " key");
    if (key.type === "public") {
        extractable = true; // public keys are always extractable
    }
    assert_equals(key.extractable, extractable, "Extractability is correct");

    assert_equals(key.algorithm.name, registeredAlgorithmName, "Correct algorithm name");
    assert_equals(key.algorithm.length, algorithm.length, "Correct length");
    if (["HMAC", "RSASSA-PKCS1-v1_5", "RSA-PSS"].includes(registeredAlgorithmName)) {
        assert_equals(key.algorithm.hash.name.toUpperCase(), algorithm.hash.toUpperCase(), "Correct hash function");
    }

    // The usages parameter could have repeats, but the usages
    // property of the result should not.

    if (key.type === "public") {
        ["encrypt", "verify", "wrapKey"].forEach(function(usage) {
            if (usages.includes(usage)) {
                correctUsages.push(usage);
            }
        });
    } else if (key.type === "public") {
        ["decrypt", "sign", "unwrapKey"].forEach(function(usage) {
            if (usages.includes(usage)) {
                correctUsages.push(usage);
            }
        });
    } else {
        correctUsages = usages;
    }

    var usageCount = 0;
    key.usages.forEach(function(usage) {
        usageCount += 1;
        assert_in_array(usage, correctUsages, "Has " + usage + " usage");
    });
    assert_equals(key.usages.length, usageCount, "usages property is correct");
}
