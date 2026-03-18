from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey

from ..kdf import KDF
from ..kem_key import KEMKey, KEMKeyPair
from ..kem_key_interface import KEMKeyInterface
from ..kem_primitives_interface import KEMPrimitivesInterface
from ..keys.x25519_key import X25519Key

# from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat


class X25519(KEMPrimitivesInterface):
    """ """

    def __init__(self):
        self._nsecret = 32
        self._nsk = 32

    def generate_key_pair(self) -> KEMKeyPair:
        sk = X25519PrivateKey.generate()
        pk = sk.public_key()
        return KEMKeyPair(X25519Key(sk), X25519Key(pk))

    def derive_key_pair(self, ikm: bytes, kdf: KDF) -> KEMKeyPair:
        dkp_prk = kdf.labeled_extract(b"", b"dkp_prk", ikm)
        sk = kdf.labeled_expand(dkp_prk, b"sk", b"", self._nsk)
        private_key = self.deserialize_private_key(sk)
        public_key = KEMKey.from_pyca_cryptography_key(private_key._key.public_key())

        return KEMKeyPair(private_key, public_key)

    def deserialize_private_key(self, key: bytes) -> KEMKeyInterface:
        return X25519Key.from_private_bytes(key)

    def serialize_public_key(self, pk: KEMKeyInterface) -> bytes:
        return pk.to_public_bytes()

    def deserialize_public_key(self, pk: bytes) -> KEMKeyInterface:
        return X25519Key.from_public_bytes(pk)

    def derive_public_key(self, sk: KEMKeyInterface) -> KEMKeyInterface:
        return X25519Key(sk.raw.public_key())

    def exchange(self, sk: KEMKeyInterface, pk: KEMKeyInterface) -> bytes:
        return sk.raw.exchange(pk.raw)
