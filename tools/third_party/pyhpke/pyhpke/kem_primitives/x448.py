from cryptography.hazmat.primitives.asymmetric.x448 import X448PrivateKey

from ..kdf import KDF
from ..kem_key import KEMKey, KEMKeyPair
from ..kem_key_interface import KEMKeyInterface
from ..kem_primitives_interface import KEMPrimitivesInterface
from ..keys.x448_key import X448Key


class X448(KEMPrimitivesInterface):
    """ """

    def __init__(self):
        self._nsecret = 64
        self._nsk = 56

    def generate_key_pair(self) -> KEMKeyPair:
        sk = X448PrivateKey.generate()
        pk = sk.public_key()
        return KEMKeyPair(X448Key(sk), X448Key(pk))

    def derive_key_pair(self, ikm: bytes, kdf: KDF) -> KEMKeyPair:
        dkp_prk = kdf.labeled_extract(b"", b"dkp_prk", ikm)
        sk = kdf.labeled_expand(dkp_prk, b"sk", b"", self._nsk)
        private_key = self.deserialize_private_key(sk)
        public_key = KEMKey.from_pyca_cryptography_key(private_key._key.public_key())

        return KEMKeyPair(private_key, public_key)

    def deserialize_private_key(self, key: bytes) -> KEMKeyInterface:
        return X448Key.from_private_bytes(key)

    def serialize_public_key(self, pk: KEMKeyInterface) -> bytes:
        return pk.to_public_bytes()

    def deserialize_public_key(self, pk: bytes) -> KEMKeyInterface:
        return X448Key.from_public_bytes(pk)

    def derive_public_key(self, sk: KEMKeyInterface) -> KEMKeyInterface:
        return X448Key(sk.raw.public_key())

    def exchange(self, sk: KEMKeyInterface, pk: KEMKeyInterface) -> bytes:
        return sk.raw.exchange(pk.raw)
