// Tests for wrapKey and unwrapKey round tripping

function run_test() {
    var subtle = crypto.subtle;

    var wrappers = [];
    var keys = [];

    Promise.all([generateWrappingKeys(), generateKeysToWrap()])
    .then(function(results) {
        wrappers.forEach(function(wrapper) {
            keys.forEach(function(key) {
                testWrapping(wrapper, key);
            })
        });
    }, function(error) {

    })
    .then(function() {
        done();
    }, function() {
        done();
    });


    function generateWrappingKeys() {
        var parameters = [
            {name: "RSA-OAEP", modulusLength: 1024, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256"},
            {name: "AES-CTR", length: 128},
            {name: "AES-CBC", length: 128},
            {name: "AES-GCM", length: 128},
            {name: "AES-KW", length: 128},
        ];

        return Promise.all(parameters.map(function(params) {
            return subtle.generateKey(params, true, ["wrapKey", "unwrapKey"])
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
            {algorithm: {name: "RSASSA-PKCS1-v1_5", modulusLength: 1024, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256"}, usages: ["sign", "verify"]},
            {algorithm: {name: "RSA-PSS", modulusLength: 1024, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256"}, usages: ["sign", "verify"]},
            {algorithm: {name: "RSA-OAEP", modulusLength: 1024, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256"}, usages: ["encrypt", "decrypt"]},
            {algorithm: {name: "ECDSA", namedCurve: "P-256"}, usages: ["sign", "verify"]},
            {algorithm: {name: "ECDH", namedCurve: "P-256"}, usages: ["deriveBits"]},
            {algorithm: {name: "AES-CTR", length: 128}, usages: ["encrypt", "decrypt"]},
            {algorithm: {name: "AES-CBC", length: 128}, usages: ["encrypt", "decrypt"]},
            {algorithm: {name: "AES-GCM", length: 128}, usages: ["encrypt", "decrypt"]},
            {algorithm: {name: "AES-KW", length: 128}, usages: ["wrapKey", "unwrapKey"]},
            {algorithm: {name: "HMAC", length: 128, hash: "SHA-256"}, usages: ["sign", "verify"]}
        ];

        return Promise.all(parameters.map(function(params) {
            return subtle.generateKey(params.algorithm, true, params.usages)
            .then(function(result) {
                if (result.constructor === CryptoKey) {
                    keys.push({name: params.algorithm.name, key: result});
                } else {
                    keys.push({name: params.algorithm.name + " public key", key: result.publicKey});
                    keys.push({name: params.algorithm.name + " private key", key: result.privateKey});
                }
                return true;
            });
        }));
    }


    function testWrapping(wrapper, toWrap) {
        var x;
        return;

        // TODO: Fill out
        promise_test(function(test) {
            var originalJwk;
            return subtle.exportKey("jwk", toWrap.key)
            .then(function(jwk) {
                originalJwk = jwk;
            }).then(function() {
                return subtle.wrapKey("jwk", toWrap.key, wrapper.key, wrapper.algorithm);
            }).then(function(wrappedResult) {
                return subtle.unwrapKey()
            })
        });
    }
}
