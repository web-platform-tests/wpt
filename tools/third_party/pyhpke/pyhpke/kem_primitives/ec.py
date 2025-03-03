from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import ec

from ..consts import KEMId
from ..kdf import KDF
from ..kem_key import KEMKey, KEMKeyPair
from ..kem_key_interface import KEMKeyInterface
from ..kem_primitives_interface import KEMPrimitivesInterface
from ..keys.ec_key import ECKey

# from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat


class EC(KEMPrimitivesInterface):
    """
    The KEM (Key Encapsulation Mechanism) context.
    """

    def __init__(self, kem_id: KEMId):
        if kem_id == KEMId.DHKEM_P256_HKDF_SHA256:
            self._crv = ec.SECP256R1()
            self._nsecret = 32
            self._nsk = 32
            self._bitmask = 0xFF
            self._order = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551
        elif kem_id == KEMId.DHKEM_P384_HKDF_SHA384:
            self._crv = ec.SECP384R1()
            self._nsecret = 48
            self._nsk = 48
            self._bitmask = 0xFF
            self._order = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973
        elif kem_id == KEMId.DHKEM_P521_HKDF_SHA512:
            self._crv = ec.SECP521R1()
            self._nsecret = 64
            self._nsk = 66
            self._bitmask = 0x01
            self._order = 0x01FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA51868783BF2F966B7FCC0148F709A5D03BB5C9B8899C47AEBB6FB71E91386409
        else:
            raise ValueError(f"Invalid kem_id: {kem_id}")

    def generate_key_pair(self) -> KEMKeyPair:
        sk = ec.generate_private_key(self._crv, backend=default_backend())
        pk = sk.public_key()
        return KEMKeyPair(ECKey(sk), ECKey(pk))

    def derive_key_pair(self, ikm: bytes, kdf: KDF) -> KEMKeyPair:
        dkp_prk = kdf.labeled_extract(b"", b"dkp_prk", ikm)

        sk = 0
        counter = 0
        while sk == 0 or sk >= self._order:
            if counter > 255:
                raise ValueError("could not derive keypair")
            raw_key = bytearray(kdf.labeled_expand(dkp_prk, b"candidate", counter.to_bytes(1, "big"), self._nsk))

            raw_key[0] = raw_key[0] & self._bitmask
            sk = int.from_bytes(raw_key, "big")
            counter = counter + 1
        sk_raw = sk.to_bytes(self._nsk, "big", signed=False)

        private_key = self.deserialize_private_key(sk_raw)
        public_key = KEMKey.from_pyca_cryptography_key(private_key._key.public_key())

        return KEMKeyPair(private_key, public_key)

    def deserialize_private_key(self, key: bytes) -> KEMKeyInterface:
        return ECKey.from_private_bytes(self._crv, key)

    def serialize_public_key(self, key: KEMKeyInterface) -> bytes:
        return key.to_public_bytes()

    def deserialize_public_key(self, key: bytes) -> KEMKeyInterface:
        return ECKey.from_public_bytes(self._crv, key)

    def derive_public_key(self, sk: KEMKeyInterface) -> KEMKeyInterface:
        return ECKey(sk.raw.public_key())

    def exchange(self, sk: KEMKeyInterface, pk: KEMKeyInterface) -> bytes:
        return sk.raw.exchange(ec.ECDH(), pk.raw)
