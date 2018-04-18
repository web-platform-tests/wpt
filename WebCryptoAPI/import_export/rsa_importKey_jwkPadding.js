// Test importKey for RSA using padded and unpadded values

function run_test() {
    var subtle = crypto.subtle;

    var alg = {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: {name: "SHA-1"},
    }

    var unpaddedDKey = {
        "alg": "RSA-OAEP",
        "d": "pU9ikDYCHpRfTmzb8bJ7PfyseNagnnr5dQ45KoK01HgiQQeL4G9CCVSd2Nv--JO9Vdv1iN_HvmvVl6kMVmdjA-PWNVevlTwBAxj8jb-LdqavnGFkVRvOmzu6SsHaL5qgN5UDBIe6u1i8lhBHaIpSFSiGpGDnwm6uvxoT8WSdhLk4uhCqn_ePPrTrIFA-rnGA7CpwTasnJhFI4C0XL--78NaF8JL6yD7lm2pJnYYqEOlZv0wRt3H7w9_FfhEv1VzQm4ODV6Bm9-Ok9mnTUppnb-5ea27jmqswDLW5KA2vmsksuKaceB0nr8Z80OCrFq7Eb7BmGWwcKXvQ4LDDsH8h",
        "dp": "QOEK814PB1Jcgn_UTUp0NlqQjTRv7u4dayD_uUcLpkI4EP6uAUU8c6ZsaW9r1M7iuIWRZjyKvbsS3pRMXsxsmOoa-_jxmMHoPeGGuNzlSE3LAcQCcEi_Ur2BGT4kKEtfhgsOf96emcF3gRBRwI2LM4JPvS65yL_hRQJxHMAJuME",
        "dq": "W_D3VOEZfsDfQK5NGf3p7MyN_0gmtPMcGoet7Yhl1poHQwlXuZ1PsiVvGs_C4iqKhJJTlIFH9wt6OvM8_6tw3oUzFwIFNXh01YtjlK8jQ4SxdFcqG1zqNF_aM3tO9AU0ZwCMm-V3IokdyRhAQ0Z5iu35TKTxbnIOmzvwyX77YxE",
        "e": "AQAB",
        "ext": true,
        "key_ops": [
            "decrypt"
        ],
        "kty": "RSA",
        "n": "yquFjaRK4iXXjlk9XmSXpANErmkYsoMkKqO8iUo-ygrWDdbWlbMU4f7O8t4rd7MFfHtD_QmBGjjzX7JSmQkWMsH7rSjdMrQsIYhP38yhK2Ecv6QODaPDRWTdA5U1y_7Zi6IvyET1NfWxm685-ETvhf04r8-hxMz5ZlXBruV7o43qnpMVOlPnBHtpuTJNXKEJmOyGKU-GMXW6xrZE0gJurcfghC7dlsW1A8M3CFb9QkY8kJXhcqAeNakHuOEFc75Y-QUTJlSibYoO3wrhbjm3UNB1wurDz_EsEpz5CFFAM1YgyieX0hviSL3EDHFZ3rGHGR1iIvwKKpgtpLTnmhv18Q",
        "p": "9CuSGkzGAsjAeclaqWTXHTyUprjGzfWJw9Is5n2eDY1eKXAX_bINXIKpaP2jGB6wOYOKr0MjZ1CKNkNfgzstNcGqxAyMVGAZZl-BX3YjTLH8wmOdoF-51xXIw-vZ31t3PpNAWCmcN2THJSG0za73KmPWPgPOmPjEeYrHCYN9tCE",
        "q": "1H059z85iFTXxv6nJHjmH7W1coS1Nwph5MnUHjW1ns5WTABHF9oF5jV5QQREcqEUUD8NG1W0Z4-0zXwj4m3WJaDYDdctr1MxiQjGrvbfWkAD-0ZpVzCzaUFNjSmc4yPDQ11aPIXRlE0Zk9kMaKyndZ5EgheUx-fsZ0OuZu6vB9E",
        "qi": "H6KZHS_4y_BYxRF73L_5J5KuwwJV4GXY_mjKg7lBLFZzCcBv78HrzIXwVmw4HYFpFjeuV6CCaBbwZFh48fmX04SLvepgMgBY1PeAhV-0K_8Umfl_VoxHEEsqKIjFTo0n44vkfGa_0JNa1QaO5aK6F9WCBDtlyb2HCDXt8fyeZr0"
    };

    var paddedDKey = {
        "alg": "RSA-OAEP",
        "d": "AKVPYpA2Ah6UX05s2_Gyez38rHjWoJ56-XUOOSqCtNR4IkEHi-BvQglUndjb_viTvVXb9Yjfx75r1ZepDFZnYwPj1jVXr5U8AQMY_I2_i3amr5xhZFUbzps7ukrB2i-aoDeVAwSHurtYvJYQR2iKUhUohqRg58Jurr8aE_FknYS5OLoQqp_3jz606yBQPq5xgOwqcE2rJyYRSOAtFy_vu_DWhfCS-sg-5ZtqSZ2GKhDpWb9MEbdx-8PfxX4RL9Vc0JuDg1egZvfjpPZp01KaZ2_uXmtu45qrMAy1uSgNr5rJLLimnHgdJ6_GfNDgqxauxG-wZhlsHCl70OCww7B_IQ",
        "dp": "QOEK814PB1Jcgn_UTUp0NlqQjTRv7u4dayD_uUcLpkI4EP6uAUU8c6ZsaW9r1M7iuIWRZjyKvbsS3pRMXsxsmOoa-_jxmMHoPeGGuNzlSE3LAcQCcEi_Ur2BGT4kKEtfhgsOf96emcF3gRBRwI2LM4JPvS65yL_hRQJxHMAJuME",
        "dq": "W_D3VOEZfsDfQK5NGf3p7MyN_0gmtPMcGoet7Yhl1poHQwlXuZ1PsiVvGs_C4iqKhJJTlIFH9wt6OvM8_6tw3oUzFwIFNXh01YtjlK8jQ4SxdFcqG1zqNF_aM3tO9AU0ZwCMm-V3IokdyRhAQ0Z5iu35TKTxbnIOmzvwyX77YxE",
        "e": "AQAB",
        "ext": true,
        "key_ops": [
            "decrypt"
        ],
        "kty": "RSA",
        "n": "yquFjaRK4iXXjlk9XmSXpANErmkYsoMkKqO8iUo-ygrWDdbWlbMU4f7O8t4rd7MFfHtD_QmBGjjzX7JSmQkWMsH7rSjdMrQsIYhP38yhK2Ecv6QODaPDRWTdA5U1y_7Zi6IvyET1NfWxm685-ETvhf04r8-hxMz5ZlXBruV7o43qnpMVOlPnBHtpuTJNXKEJmOyGKU-GMXW6xrZE0gJurcfghC7dlsW1A8M3CFb9QkY8kJXhcqAeNakHuOEFc75Y-QUTJlSibYoO3wrhbjm3UNB1wurDz_EsEpz5CFFAM1YgyieX0hviSL3EDHFZ3rGHGR1iIvwKKpgtpLTnmhv18Q",
        "p": "9CuSGkzGAsjAeclaqWTXHTyUprjGzfWJw9Is5n2eDY1eKXAX_bINXIKpaP2jGB6wOYOKr0MjZ1CKNkNfgzstNcGqxAyMVGAZZl-BX3YjTLH8wmOdoF-51xXIw-vZ31t3PpNAWCmcN2THJSG0za73KmPWPgPOmPjEeYrHCYN9tCE",
        "q": "1H059z85iFTXxv6nJHjmH7W1coS1Nwph5MnUHjW1ns5WTABHF9oF5jV5QQREcqEUUD8NG1W0Z4-0zXwj4m3WJaDYDdctr1MxiQjGrvbfWkAD-0ZpVzCzaUFNjSmc4yPDQ11aPIXRlE0Zk9kMaKyndZ5EgheUx-fsZ0OuZu6vB9E",
        "qi": "H6KZHS_4y_BYxRF73L_5J5KuwwJV4GXY_mjKg7lBLFZzCcBv78HrzIXwVmw4HYFpFjeuV6CCaBbwZFh48fmX04SLvepgMgBY1PeAhV-0K_8Umfl_VoxHEEsqKIjFTo0n44vkfGa_0JNa1QaO5aK6F9WCBDtlyb2HCDXt8fyeZr0"
    };

    // keys to test
    var testVectors = [
        { desc: "Import key with unpadded d", key: unpaddedDKey },
        { desc: "Import key with leading 0 in d", key: paddedDKey },
    ];

    // TESTS ARE HERE:
    testVectors.forEach(function(vector) {
        promise_test(function (test) {
            return subtle.importKey("jwk", vector.key, alg, true, ["decrypt"]).
            then(function(key) {
                assert_equals(key.constructor, CryptoKey, "Imported a CryptoKey object");
            }, function(err) {
                assert_unreached("Threw an unexpected error: " + err.toString());
            });
        }, vector.desc);
    });

    return; // from run_test
}
