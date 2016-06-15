
function run_test() {
    var subtle = self.crypto.subtle;

    console.log("About to set it all up")
    setUpBaseKeys(getTestVectors())
    .then(function(testVectors) {
        console.log("running tests with " + testVectors.length + " vectors");
        testVectors.forEach(function(vector) {
            console.log("running test " + vector.name);
            promise_test(function(test) {
                return subtle.deriveBits({name: "PBKDF2", salt: vector.salt, iterations: vector.iterations, hash: vector.hash}, vector.baseKey, vector.length)
                .then(function(bits) {
                    assert_equals(bits.byteLength, vector.length / 8, "Returned requested number of bits");
                }, function(err) {
                    assert_unreached("deriveBits failed for " + vector.name + ". Message: '" + err.message + "'");
                });
            }, vector.name + " successful attempt.");
        });
        //done();
    }, function(err) {
        promise_test(function(test) {
            assert_unreached("setUpBaseKeys failed with error '" + err.message + "'");
        }, "setUpBaseKeys");
        //done();
    });

    function setUpBaseKeys(testVectors) {
        console.log("setting up " + testVectors.length + " vectors");
        var promises = [];

        testVectors.forEach(function(vector) {
            console.log("setting up vector for " + vector.name)
            var operation = subtle.importKey("raw", vector.baseKeyBuffer, {name: "PBKDF2"}, false, ["deriveKey", "deriveBits"]);
            operation.then(function(key) {
                console.log("got the key")
                vector.baseKey = key;
            }, function(err) {
                console.log("Error " + err.name + ": " + err.message)
            });
            console.log("About to push")
            promises.push(operation);
            console.log("Pushed")
        });

        console.log("Waiting for " + promises.length + " promises to resolve.")
        return Promise.all(promises)
        .then(function() {
            console.log("Returning test vectors")
            return testVectors;
        });
    }

}
