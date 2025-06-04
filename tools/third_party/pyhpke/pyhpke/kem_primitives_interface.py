from .kdf import KDF
from .kem_key import KEMKeyInterface, KEMKeyPair


class KEMPrimitivesInterface(object):
    """
    The KEM (Key Encapsulation Mechanism) interface.
    """

    def generate_key_pair(self) -> KEMKeyPair:
        raise NotImplementedError()

    def derive_key_pair(self, ikm: bytes, kdf: KDF) -> KEMKeyPair:
        raise NotImplementedError()

    def serialize_private_key(self, key: bytes) -> KEMKeyInterface:
        raise NotImplementedError()

    def serialize_public_key(self, key: KEMKeyInterface) -> bytes:
        raise NotImplementedError()

    def deserialize_private_key(self, key: bytes) -> KEMKeyInterface:
        raise NotImplementedError()

    def deserialize_public_key(self, key: bytes) -> KEMKeyInterface:
        raise NotImplementedError()

    def derive_public_key(self, sk: KEMKeyInterface) -> KEMKeyInterface:
        raise NotImplementedError()

    def exchange(self, sk: KEMKeyInterface, pk: KEMKeyInterface) -> bytes:
        raise NotImplementedError()

    # def encap(self, pkr: KEMKeyInterface, sks: Optional[KEMKeyInterface] = None) -> Tuple[bytes, bytes]:
    #     raise NotImplementedError()
    #
    # def decap(self, enc: bytes, skr: KEMKeyInterface, pks: Optional[KEMKeyInterface]) -> bytes:
    #     raise NotImplementedError()
    #
