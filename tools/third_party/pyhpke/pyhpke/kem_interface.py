from typing import Optional, Tuple

from .consts import KEMId
from .kem_key import KEMKeyPair
from .kem_key_interface import KEMKeyInterface


class KEMInterface(object):
    """
    The KEM (Key Encapsulation Mechanism) interface.
    """

    @property
    def id(self) -> KEMId:
        """
        The KEM identifier.
        """
        raise NotImplementedError()

    def deserialize_private_key(self, key: bytes) -> KEMKeyInterface:
        raise NotImplementedError()

    def deserialize_public_key(self, key: bytes) -> KEMKeyInterface:
        raise NotImplementedError()

    def encap(
        self, pkr: KEMKeyInterface, sks: Optional[KEMKeyInterface] = None, eks: Optional[KEMKeyPair] = None
    ) -> Tuple[bytes, bytes]:
        raise NotImplementedError()

    def decap(self, enc: bytes, skr: KEMKeyInterface, pks: Optional[KEMKeyInterface] = None) -> bytes:
        raise NotImplementedError()

    def derive_key_pair(self, ikm: bytes) -> KEMKeyPair:
        raise NotImplementedError()
