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
        var generators = [];

        return new Promise((resolve, reject) => {
            resolve("okay");
        });

        //generators.push(subtle.generateKey().then());

        return Promise.all(generators);
    }


    function testWrapping(wrapper, key) {
        var x;
    }
}
