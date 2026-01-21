from pyhpke import AEADId, CipherSuite, KDFId, KEMId, KEMKey


class TestSample:
    """
    Tests for sample code.
    """

    def test_hpke_ec(self):
        # The sender side:
        suite_s = CipherSuite.new(KEMId.DHKEM_P256_HKDF_SHA256, KDFId.HKDF_SHA256, AEADId.AES128_GCM)
        pkr = KEMKey.from_jwk(
            {
                "kid": "01",
                "kty": "EC",
                "crv": "P-256",
                "x": "Ze2loSV3wrroKUN_4zhwGhCqo3Xhu1td4QjeQ5wIVR0",
                "y": "HlLtdXARY_f55A3fnzQbPcm6hgr34Mp8p-nuzQCE0Zw",
            }
        )
        enc, sender = suite_s.create_sender_context(pkr)
        ct = sender.seal(b"Hello world!")

        # The recipient side:
        suite_r = CipherSuite.new(KEMId.DHKEM_P256_HKDF_SHA256, KDFId.HKDF_SHA256, AEADId.AES128_GCM)
        skr = KEMKey.from_jwk(
            {
                "kid": "01",
                "kty": "EC",
                "crv": "P-256",
                "x": "Ze2loSV3wrroKUN_4zhwGhCqo3Xhu1td4QjeQ5wIVR0",
                "y": "HlLtdXARY_f55A3fnzQbPcm6hgr34Mp8p-nuzQCE0Zw",
                "d": "r_kHyZ-a06rmxM3yESK84r1otSg-aQcVStkRhA-iCM8",
            }
        )
        recipient = suite_r.create_recipient_context(enc, skr)
        pt = recipient.open(ct)

        assert pt == b"Hello world!"

    def test_hpke_x25519(self):
        # The sender side:
        suite_s = CipherSuite.new(KEMId.DHKEM_X25519_HKDF_SHA256, KDFId.HKDF_SHA256, AEADId.AES256_GCM)
        pkr = KEMKey.from_jwk(
            {
                "kid": "X25519-01",
                "kty": "OKP",
                "crv": "X25519",
                "x": "y3wJq3uXPHeoCO4FubvTc7VcBuqpvUrSvU6ZMbHDTCI",
            }
        )
        enc, sender = suite_s.create_sender_context(pkr)
        ct = sender.seal(b"Hello world!")

        # The recipient side:
        suite_r = CipherSuite.new(KEMId.DHKEM_X25519_HKDF_SHA256, KDFId.HKDF_SHA256, AEADId.AES256_GCM)
        skr = KEMKey.from_jwk(
            {
                "kid": "X25519-01",
                "kty": "OKP",
                "crv": "X25519",
                "x": "y3wJq3uXPHeoCO4FubvTc7VcBuqpvUrSvU6ZMbHDTCI",
                "d": "vsJ1oX5NNi0IGdwGldiac75r-Utmq3Jq4LGv48Q_Qc4",
            }
        )
        recipient = suite_r.create_recipient_context(enc, skr)
        pt = recipient.open(ct)

        assert pt == b"Hello world!"

    def test_hpke_x25519_from_pem(self):
        public_key_pem = b"-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VuAyEAoMfvlI5DN08JRFP2fhWvZ6vBEl28yFeS9O9YQUjNyCY=\n-----END PUBLIC KEY-----"
        pkr = KEMKey.from_pem(public_key_pem)
        suite = CipherSuite.new(KEMId.DHKEM_X25519_HKDF_SHA256, KDFId.HKDF_SHA256, AEADId.AES128_GCM)
        enc, sender = suite.create_sender_context(pkr)
        ct = sender.seal(b"Hello world!")

        private_key_pem = b"-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VuBCIEIMAXvyHjAeXy9x4MXF6rwGbDKw7crgDriFTFXO+XsS1F\n-----END PRIVATE KEY-----"
        skr = KEMKey.from_pem(private_key_pem)
        recipient = suite.create_recipient_context(enc, skr)
        pt = recipient.open(ct)

        assert pt == b"Hello world!"

    def test_hpke_x448(self):
        # The sender side:
        suite_s = CipherSuite.new(KEMId.DHKEM_X448_HKDF_SHA512, KDFId.HKDF_SHA512, AEADId.CHACHA20_POLY1305)
        pkr = KEMKey.from_jwk(
            {
                "kid": "X448-01",
                "kty": "OKP",
                "crv": "X448",
                "x": "IkLmc0klvEMXYneHMKAB6ePohryAwAPVe2pRSffIDY6NrjeYNWVX5J-fG4NV2OoU77C88A0mvxI",
            }
        )
        enc, sender = suite_s.create_sender_context(pkr)
        ct = sender.seal(b"Hello world!")

        # The recipient side:
        suite_r = CipherSuite.new(KEMId.DHKEM_X448_HKDF_SHA512, KDFId.HKDF_SHA512, AEADId.CHACHA20_POLY1305)
        skr = KEMKey.from_jwk(
            {
                "kid": "X448-01",
                "kty": "OKP",
                "crv": "X448",
                "x": "IkLmc0klvEMXYneHMKAB6ePohryAwAPVe2pRSffIDY6NrjeYNWVX5J-fG4NV2OoU77C88A0mvxI",
                "d": "rJJRG3nshyCtd9CgXld8aNaB9YXKR0UOi7zj7hApg9YH4XdBO0G8NcAFNz_uPH2GnCZVcSDgV5c",
            }
        )
        recipient = suite_r.create_recipient_context(enc, skr)
        pt = recipient.open(ct)

        assert pt == b"Hello world!"
