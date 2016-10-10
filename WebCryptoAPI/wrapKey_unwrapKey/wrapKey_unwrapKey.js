// Tests for wrapKey and unwrapKey round tripping

function run_test() {
    var subtle = self.crypto.subtle;

    var wrappers = [];  // Things we wrap (and upwrap) keys with
    var keys = [];      // Things to wrap and unwrap

    // Generate all the keys needed, then iterate over all combinations
    // to test wrapping and unwrapping.
    Promise.all([generateWrappingKeys(), generateKeysToWrap()])
    .then(function(results) {
        wrappers.forEach(function(wrapper) {
            keys.forEach(function(key) {
                testWrapping(wrapper, key);
            })
        });
    }, function(err) {
        promise_test(function(test) {
            assert_unreached("A key failed to generate: " + err.name + ": " + err.message)
        }, "Could not run all tests")
    })
    .then(function() {
        done();
    }, function(err) {
        promise_test(function(test) {
            assert_unreached("A test failed to run: " + err.name + ": " + err.message)
        }, "Could not run all tests")
    });


    function generateWrappingKeys() {
        // There are five algorithms that can be used for wrapKey/unwrapKey.
        // Generate one key with typical parameters for each kind.
        //
        // Note: we don't need cryptographically strong parameters for things
        // like IV - just any legal value will do.
        var parameters = [
            {
                name: "RSA-OAEP",
                generateParameters: {name: "RSA-OAEP", modulusLength: 4096, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256"},
                wrapParameters: {name: "RSA-OAEP", label: new Uint8Array(8)}
            },
            {
                name: "AES-CTR",
                generateParameters: {name: "AES-CTR", length: 128},
                wrapParameters: {name: "AES-CTR", counter: new Uint8Array(16), length: 64}
            },
            {
                name: "AES-CBC",
                generateParameters: {name: "AES-CBC", length: 128},
                wrapParameters: {name: "AES-CBC", iv: new Uint8Array(16)}
            },
            {
                name: "AES-GCM",
                generateParameters: {name: "AES-GCM", length: 128},
                wrapParameters: {name: "AES-GCM", iv: new Uint8Array(16), additionalData: new Uint8Array(16), tagLength: 64}
            },
            {
                name: "AES-KW",
                generateParameters: {name: "AES-KW", length: 128},
                wrapParameters: {name: "AES-KW"}
            }
        ];

        return Promise.all(parameters.map(function(params) {
            return subtle.generateKey(params.generateParameters, true, ["wrapKey", "unwrapKey"])
            .then(function(key) {
                var wrapper;
                if (params.name === "RSA-OAEP") { // we have a key pair, not just a key
                    wrapper = {wrappingKey: key.publicKey, unwrappingKey: key.privateKey, parameters: params};
                } else {
                    wrapper = {wrappingKey: key, unwrappingKey: key, parameters: params};
                }
                wrappers.push(wrapper);
                return true;
            })
        }));
    }


    function generateKeysToWrap() {
        var parameters = [
            {algorithm: {name: "RSASSA-PKCS1-v1_5", modulusLength: 1024, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256"}, privateUsages: ["sign"], publicUsages: ["verify"]},
            {algorithm: {name: "RSA-PSS", modulusLength: 1024, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256"}, privateUsages: ["sign"], publicUsages: ["verify"]},
            {algorithm: {name: "RSA-OAEP", modulusLength: 1024, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256"}, privateUsages: ["decrypt"], publicUsages: ["encrypt"]},
            {algorithm: {name: "ECDSA", namedCurve: "P-256"}, privateUsages: ["sign"], publicUsages: ["verify"]},
            {algorithm: {name: "ECDH", namedCurve: "P-256"}, privateUsages: ["deriveBits"], publicUsages: []},
            {algorithm: {name: "AES-CTR", length: 128}, usages: ["encrypt", "decrypt"]},
            {algorithm: {name: "AES-CBC", length: 128}, usages: ["encrypt", "decrypt"]},
            {algorithm: {name: "AES-GCM", length: 128}, usages: ["encrypt", "decrypt"]},
            {algorithm: {name: "AES-KW", length: 128}, usages: ["wrapKey", "unwrapKey"]},
            {algorithm: {name: "HMAC", length: 128, hash: "SHA-256"}, usages: ["sign", "verify"]}
        ];

        return Promise.all(parameters.map(function(params) {
            var usages;
            if ("usages" in params) {
                usages = params.usages;
            } else {
                usages = params.publicUsages.concat(params.privateUsages);
            }

            return subtle.generateKey(params.algorithm, true, usages)
            .then(function(result) {
                if (result.constructor === CryptoKey) {
                    keys.push({name: params.algorithm.name, algorithm: params.algorithm, usages: params.usages, key: result});
                } else {
                    keys.push({name: params.algorithm.name + " public key", algorithm: params.algorithm, usages: params.publicUsages, key: result.publicKey});
                    keys.push({name: params.algorithm.name + " private key", algorithm: params.algorithm, usages: params.privateUsages, key: result.privateKey});
                }
                return true;
            });
        }));
    }


    // Can we successfully "round-trip" (wrap, then unwrap, a key)?
    function testWrapping(wrapper, toWrap) {
        var formats;

        if (toWrap.name.includes("private")) {
            formats = ["pkcs8", "jwk"];
        } else if (toWrap.name.includes("public")) {
            formats = ["spki", "jwk"]
        } else {
            formats = ["raw", "jwk"]
        }

        formats.forEach(function(fmt) {
            var originalExport;

            promise_test(function(test) {
                return subtle.exportKey(fmt, toWrap.key)
                .then(function(exportedKey) {
                    originalExport = exportedKey;
                    return exportedKey;
                }).then(function(exportedKey) {
                    return subtle.wrapKey(fmt, toWrap.key, wrapper.wrappingKey, wrapper.parameters.wrapParameters);
                }).then(function(wrappedResult) {
                    return subtle.unwrapKey(fmt, wrappedResult, wrapper.unwrappingKey, wrapper.parameters.wrapParameters, toWrap.algorithm, true, toWrap.usages)
                }).then(function(unwrappedResult) {
                    return subtle.exportKey(fmt, unwrappedResult)
                }).then(function(roundTripExport) {
                    if ("byteLength" in originalExport) {
                        assert_true(equalBuffers(originalExport, roundTripExport), "Post-wrap export matches original export");
                    } else {
                        assert_true(equalJwk(originalExport, roundTripExport), "Post-wrap export matches original export.");
                    }
                }, function(err) {
                    if (wrappingIsPossible(originalExport, wrapper.parameters.name)) {
                        assert_unreached("Round trip threw an error - " + err.name + ': "' + err.message + '"');
                    } else {
                        assert_true(true, "Skipped test due to key length restrictions");
                    }
                })
            }, "Can wrap and unwrap " + toWrap.name + " keys using " + fmt + " and " + wrapper.parameters.name);

        });
        
        if (canJwkWrapByHand(wrapper.wrappingKey, wrapper.parameters.wrapParameters)
                    && canCompareNonExtractableKeys(toWrap.key)) {
            promise_test(function(test){
                return wrapAsNonExtractableJwk(toWrap.key,wrapper.wrappingKey,wrapper.parameters.wrapParameters)
                .then(function(wrappedResult){
                    return subtle.unwrapKey("jwk",wrappedResult,wrapper.unwrappingKey,wrapper.parameters.wrapParameters, toWrap.algorithm, false, toWrap.usages);
                }).then(function(unwrappedResult){
                    assert_false(unwrappedResult.extractable, "Unwrapped key is non-extractable");
                    return equalKeys(toWrap.key,unwrappedResult);
                }).then(function(result){
                    assert_true(result, "Unwrapped key matches original");
                }).catch(function(err){
                    assert_unreached("Round trip threw an error - " + err.name + ': "' + err.message + '"');
                });
            }, "Can unwrap " + toWrap.name + " non-extractable keys using jwk and " + wrapper.parameters.name);
        }

    }
    
    // Test if we can perform wrapping by hand
    function canJwkWrapByHand(wrappingKey, wrapParameters){
        return (wrapParameters.name === "AES-CTR");
    }
    
    // Implement key wrapping by hand to wrap a key as non-extractable JWK
    function wrapAsNonExtractableJwk(key,wrappingKey,wrapParameters){
        var encryptKey;
        return subtle.exportKey("raw",wrappingKey)
        .then(function(rawWrappingKey){
            return subtle.importKey("raw", rawWrappingKey, {name: "AES-CTR", length: 128}, true, ["encrypt"]);
        }).then(function(importedWrappingKey){
            encryptKey = importedWrappingKey;
            return subtle.exportKey("jwk",key);
        }).then(function(exportedKey){
            exportedKey.ext = false;
            var jwk = str2ab(JSON.stringify(exportedKey));
            return subtle.encrypt(wrapParameters,encryptKey,jwk);
        });
    }


    // RSA-OAEP can only wrap relatively small payloads. AES-KW can only
    // wrap payloads a multiple of 8 bytes long.
    //
    // Note that JWK payloads will be converted to ArrayBuffer for wrapping,
    // and should automatically be padded if needed for AES-KW.
    function wrappingIsPossible(exportedKey, algorithmName) {
        if ("byteLength" in exportedKey && algorithmName === "AES-KW") {
            return exportedKey.byteLength % 8 === 0;
        }

        if ("byteLength" in exportedKey && algorithmName === "RSA-OAEP") {
            // RSA-OAEP can only encrypt payloads with lengths shorter
            // than modulusLength - 2*hashLength - 1 bytes long. For
            // a 4096 bit modulus and SHA-256, that comes to
            // 4096/8 - 2*(256/8) - 1 = 512 - 2*32 - 1 = 447 bytes.
            return exportedKey.byteLength <= 446;
        }

        if ("kty" in exportedKey && algorithmName === "RSA-OAEP") {
            return JSON.stringify(exportedKey).length <= 478;
        }

        return true;
    }


    // Helper methods follow:

    // Are two array buffers the same?
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

    // Are two Jwk objects "the same"? That is, does the object returned include
    // matching values for each property that was expected? It's okay if the
    // returned object has extra methods; they aren't checked.
    function equalJwk(expected, got) {
        var fields = Object.keys(expected);
        var fieldName;

        for(var i=0; i<fields.length; i++) {
            fieldName = fields[i];
            if (!(fieldName in got)) {
                return false;
            }
            if (objectToString(expected[fieldName]) !== objectToString(got[fieldName])) {
                return false;
            }
        }

        return true;
    }

    // Character representation of any object we may use as a parameter.
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
    
    // Can we compare key values by using them
    function canCompareNonExtractableKeys(key){
        if (key.algorithm.name !== "AES-CTR") {
            return false;
        }
        for(var i = 0; i < key.usages.length; ++i){
            if ( key.usages[i] === "decrypt" ) {
                return true;
            }
        }
        return false;
    }
    
    // Compare two keys by using them (works for non-extractable keys)
    function equalKeys(expected, got){
        if ( expected.algorithm.name !== got.algorithm.name ) {
            return Promise.resolve(false);
        }
        
        return subtle.exportKey("raw",expected)
        .then(function(rawExpectedKey){
            return subtle.importKey("raw",rawExpectedKey,{name: "AES-CTR", length: 128}, true, ["encrypt"]);
        }).then(function(expectedEncryptKey){
            return subtle.encrypt({name: "AES-CTR", counter: new Uint8Array(16), length: 64}, expectedEncryptKey, new Uint8Array(32));
        }).then(function(encryptedData){
            return subtle.decrypt({name: "AES-CTR", counter: new Uint8Array(16), length: 64}, got, encryptedData);
        }).then(function(decryptedData){
            var result = new Uint8Array(decryptedData);
            return !result.some(x => x);
        });
    }
    
    function str2ab(str)        { return Uint8Array.from( str.split(''), function(s){return s.charCodeAt(0)} ); }
    function ab2str(ab)         { return String.fromCharCode.apply(null, new Uint8Array(ab)); }


}
