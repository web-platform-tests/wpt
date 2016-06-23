
function run_test() {
    var subtle = self.crypto.subtle;
    var testData = getTestData();
    var passwords = testData.passwords;
    var salts = testData.salts;
    var derivations = testData.derivations;

    setUpBaseKeys(passwords)
    .then(function(baseKeys) {
        Object.keys(derivations).forEach(function(passwordSize) {
            Object.keys(derivations[passwordSize]).forEach(function(saltSize) {
                Object.keys(derivations[passwordSize][saltSize]).forEach(function(hashName) {
                    Object.keys(derivations[passwordSize][saltSize][hashName]).forEach(function(iterations) {
                        promise_test(function(test) {
                            subtle.deriveBits({name: "PBKDF2", salt: salts[saltSize], hash: hashName, iterations: iterations}, baseKeys[0], 256)
                            .then(function(derivation) {
                                assert_true(equalBuffers(derivation, derivations[passwordSize][saltSize][hashName][iterations]), "Derived correct key");
                            }, function(err) {
                                assert_unreached("deriveBits failed with error " + err.name + ": " + err.message);
                            });
                        }, passwordSize + " password, " + saltSize + " salt, " + hashName + ", with " + iterations + " iterations");
                    });
                });
            });
        });
    }, function(err) {
        promise_test(function(test) {
            assert_unreached("setUpBaseKeys failed with error '" + err.message + "'");
        }, "setUpBaseKeys");
    });

    function setUpBaseKeys(passwords) {
        var promises = [];
        Object.keys(passwords).forEach(function(passwordSize) {
            promises.push(subtle.importKey("raw", passwords[passwordSize], {name: "PBKDF2"}, false, ["deriveKey", "deriveBits"]));
        });
        return Promise.all(promises);
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

}
