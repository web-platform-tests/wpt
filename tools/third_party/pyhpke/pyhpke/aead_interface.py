from .aead_key_interface import AEADKeyInterface
from .consts import AEADId


class AEADInterface:
    """
    The AEAD (Authenticated Encapsulation with Additional Data) interface.
    """

    @property
    def id(self) -> AEADId:
        """
        The AEAD identifier.
        """
        raise NotImplementedError()

    @property
    def key_size(self) -> int:
        """
        The AEAD key size.
        """
        raise NotImplementedError()

    @property
    def nonce_size(self) -> int:
        """
        The AEAD nonce size.
        """
        raise NotImplementedError()

    @property
    def tag_size(self) -> int:
        """
        The AEAD tag size.
        """
        raise NotImplementedError()

    def import_key(self, key: bytes) -> AEADKeyInterface:
        """
        Imports a byte string as an AEAD key.
        """
        raise NotImplementedError()
