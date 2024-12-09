import json
import os
from typing import Optional

import pytest

from pyhpke import AEADId, CipherSuite, KDFId, KEMId, KEMKeyInterface, KEMKeyPair


class TestWithOfficialTestVectors:
    """
    Tests with official test vectors.
    """

    @pytest.mark.parametrize(
        "v",
        json.load(open(os.path.join(os.path.dirname(os.path.realpath(__file__)), "vectors", "test-vectors.json"))),
    )
    def test_with_official_test_vectors(self, v):
        suite = CipherSuite.new(KEMId(v["kem_id"]), KDFId(v["kdf_id"]), AEADId(v["aead_id"]))

        # deserialize_{private,public}_key
        pke = suite.kem.deserialize_public_key(bytes.fromhex(v["pkEm"]))
        ske = suite.kem.deserialize_private_key(bytes.fromhex(v["skEm"]))
        eks = KEMKeyPair(ske, pke)
        pkr = suite.kem.deserialize_public_key(bytes.fromhex(v["pkRm"]))
        skr = suite.kem.deserialize_private_key(bytes.fromhex(v["skRm"]))
        sks: Optional[KEMKeyInterface] = None
        pks: Optional[KEMKeyInterface] = None
        if "skSm" in v and "pkSm" in v:
            sks = suite.kem.deserialize_private_key(bytes.fromhex(v["skSm"]))
            pks = suite.kem.deserialize_public_key(bytes.fromhex(v["pkSm"]))

        # TODO derive_key_pair
        ikme = bytes.fromhex(v["ikmE"])
        ikme_keypair = suite.kem.derive_key_pair(ikme)
        assert ikme_keypair.private_key.to_private_bytes() == ske.to_private_bytes()
        assert ikme_keypair.public_key.to_public_bytes() == pke.to_public_bytes()

        ikmr = bytes.fromhex(v["ikmR"])
        ikmr_keypair = suite.kem.derive_key_pair(ikmr)
        assert ikmr_keypair.private_key.to_private_bytes() == skr.to_private_bytes()
        assert ikmr_keypair.public_key.to_public_bytes() == pkr.to_public_bytes()

        # create_{sender,recipient}_context
        info = bytes.fromhex(v["info"])
        psk = bytes.fromhex(v["psk"]) if "psk" in v else b""
        psk_id = bytes.fromhex(v["psk_id"]) if "psk_id" in v else b""
        enc, sender = suite.create_sender_context(pkr, info, sks, psk, psk_id, eks)
        assert enc == bytes.fromhex(v["enc"])
        recipient = suite.create_recipient_context(enc, skr, info, pks, psk, psk_id)
        if v["aead_id"] != 0xFFFF:
            for ve in v["encryptions"]:
                pt = bytes.fromhex(ve["pt"])
                aad = bytes.fromhex(ve["aad"])
                ct = bytes.fromhex(ve["ct"])
                sealed = sender.seal(pt, aad)
                opened = recipient.open(sealed, aad)
                assert pt == opened
                assert ct == sealed
            return
        for ve in v["exports"]:
            ec = bytes.fromhex(ve["exporter_context"]) if len(ve["exporter_context"]) > 0 else b""
            ev = bytes.fromhex(ve["exported_value"])
            exported = sender.export(ec, ve["L"])
            assert ev == exported
            exported = recipient.export(ec, ve["L"])
            assert ev == exported
