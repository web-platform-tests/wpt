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
    }, function(error) {
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
                generateParameters: {name: "RSA-OAEP", modulusLength: 1024, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256"},
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
            {algorithm: {name: "ECDH", namedCurve: "P-256"}, privateUsages: ["deriveBits"], publicUsages: ["deriveBits"]},
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
        var originalJwk;    // Check that the wrapped then unwrapped key has the same JWK representation as at first

        promise_test(function(test) {
            return subtle.exportKey("jwk", toWrap.key)
            .then(function(jwk) {
                originalJwk = jwk;
            }).then(function() {
                return subtle.wrapKey("jwk", toWrap.key, wrapper.wrappingKey, wrapper.parameters.wrapParameters);
            }).then(function(wrappedResult) {
                return subtle.unwrapKey("jwk", wrappedResult, wrapper.unwrappingKey, wrapper.parameters.wrapParameters, toWrap.algorithm, true, toWrap.usages)
            }).then(function(unwrappedResult) {
                return subtle.exportKey("jwk", unwrappedResult)
            }).then(function(roundTripJwk) {
                console.log(originalJwk, roundTripJwk);
                assert_true(true, "Got to the end, anyway");
            }).catch(function(err) {
                assert_unreached("Round trip threw an error - " + err.name + ': "' + err.message + '"');
            });

        }, "Can wrap and unwrap " + toWrap.name + " keys using " + wrapper.parameters.name);

    }
}
