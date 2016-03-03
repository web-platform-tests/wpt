
var alg = {name: "RSASSA-PKCS1-v1_5", modulusLength:2048, publicExponent: new Uint8Array([0x1, 0x0, 0x1])};

var hashArray = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

function check_jwk_key(key, jwk)
{
    assert_own_property(jwk, "kty");
    assert_equals(jwk["kty"], "RSA", "Key Type not RSA but " + jwk["kty"]);
    assert_own_property(jwk, "alg");
    switch (key.algorithm.hash.name) {
    case "SHA-1":
        assert_equals(jwk["alg"], "RS1");
        break;
    case "SHA-256":
        assert_equals(jwk["alg"], "RS256");
        break;
    case "SHA-384":
        assert_equals(jwk["alg"], "RS384");
        break;
    case "SHA-512":
        assert_equals(jwk["alg"], "RS512");
        break;
    default:
        assert_unreached("Unknown hash algorithm " + key.algorithm.hash.name);
        break;
    }
    assert_own_property(jwk, "n");
    assert_own_property(jwk, "e");
    if (key.type == "private") {
        assert_own_property(jwk, "d");
        assert_own_property(jwk, "p");
        assert_own_property(jwk, "q");
        assert_own_property(jwk, "dp");
        assert_own_property(jwk, "dq");
        assert_own_property(jwk, "qi");
    }
    assert_own_property(jwk, "key_ops");
    assert_array_equals(jwk["key_ops"], key.usages);
    assert_own_property(jwk, "ext");
    assert_equals(jwk["ext"], true);
}

var asnRSAEncryption = new Uint8Array([ 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01 ]);
var asnNull = new Uint8Array([0x05, 0x00]);

function check_spki_key(key, asn1Data)
{
    var asn1List = asn1_to_fields(asn1Data);

    assert_array_equals(asn1List[2], asnRSAEncryption, "OID=1.2.840.113549.1.1.1");
    assert_array_equals(asn1List[3], asnNull, "Parameters are NULL");
}

function check_pkcs8_key(key, asn1Data)
{
    var asn1List = asn1_to_fields(asn1Data);

    assert_array_equals(asn1List[3], asnRSAEncryption, "OID=1.2.840.113549.1.1.1");
    assert_array_equals(asn1List[4], asnNull, "Parameters are NULL");
}

function export_test(t, format, key)
{
    self.crypto.subtle.exportKey(format, key).then(
        t.step_func(function(keyData) {
            //  Check the data for the key we just exported.
            switch (format) {
            case "jwk":
                check_jwk_key(key, keyData)
                break;
            case "spki":
                check_spki_key(key, keyData);
                break;
            case "pkcs8":
                check_pkcs8_key(key, keyData);
                break;
            }

            //  We should be able to import what we just exported

            self.crypto.subtle.importKey(format, keyData, key.algorithm, true, key.usages).then(
                t.step_func(function(newKey) {
                    t.done();
                }),
                t.step_func(function(err) {
                    assert_unreached("Reimport failed with error " + err);
                    t.done();
                }));
        }),
        t.step_func(function(err) {
            assert_unreached("Export failed with error " + err);
            t.done();
        })
    )
}

function run_tests(key)
{
    var t;

    t = async_test("export test - " + key.algorithm.name + " " + key.algorithm.hash.name + " " + key.type + " jwk");
    export_test(t, "jwk", key);

    if (key.type == "private") {
        t = async_test("export test - " + key.algorithm.name + " " + key.algorithm.hash.name + " pkcs8");
        export_test(t, "pkcs8", key);
    }

    if (key.type == "public") {
        t = async_test("export test - " + key.algorithm.name + " " + key.algorithm.hash.name + " spki");
        export_test(t, "spki", key);
    }
}

function run_test()
{
    var iAlg;
    var p = [];

    //  run the test loop for each hash algorithm
    for (iAlg=0; iAlg < hashArray.length; iAlg++) {
        alg["hash"] = hashArray[iAlg];
        p.push(self.crypto.subtle.generateKey(alg, true, ["verify", "sign"]).then(
            function(newKey) {
                run_tests(newKey.privateKey);
                run_tests(newKey.publicKey);
            }
        ));
    }

    Promise.all(p).then(function(x) { done(); });
}
