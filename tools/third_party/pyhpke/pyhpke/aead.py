from .aead_interface import AEADInterface
from .aead_key import AEADKey
from .aead_key_interface import AEADKeyInterface
from .consts import AEADId


class AEAD(AEADInterface):
    """
    An AEAD(Authenticated Encapsulation with Additional Data) context.
    """

    def __init__(self, aead_id: AEADId):
        """
        Creates an AEAD context.

        Args:
            aead_id (int): An AEAD (Authenticated Encryption with Additional Data) identifier.
        Returns:
            bytes: An AEAD context object.
        """
        if aead_id == AEADId.AES128_GCM:
            self._nk = 16
            self._nn = 12
            self._nt = 16
        elif aead_id == AEADId.AES256_GCM:
            self._nk = 32
            self._nn = 12
            self._nt = 16
        elif aead_id == AEADId.CHACHA20_POLY1305:
            self._nk = 32
            self._nn = 12
            self._nt = 16
        elif aead_id == AEADId.EXPORT_ONLY:
            self._nk = 0
            self._nn = 0
            self._nt = 0
        else:
            raise ValueError(f"Invalid aead_id: {aead_id}.")
        self._id = aead_id
        return

    @property
    def id(self) -> AEADId:
        """
        The AEAD identifier.
        """
        return self._id

    @property
    def key_size(self) -> int:
        """
        The AEAD key size.
        """
        return self._nk

    @property
    def nonce_size(self) -> int:
        """
        The AEAD nonce size.
        """
        return self._nn

    @property
    def tag_size(self) -> int:
        """
        The AEAD tag size.
        """
        return self._nt

    def import_key(self, key: bytes) -> AEADKeyInterface:
        """
        Imports a byte string as an AEAD key.
        """
        return AEADKey.from_bytes(self._id, key)


class AEADParams(object):
    def __init__(self, ctx: AEADInterface, key: bytes, base_nonce: bytes, seq: int, exporter_secret: bytes):
        self._ctx = ctx
        self._key = key
        self._base_nonce = base_nonce
        self._seq = seq
        self._exporter_secret = exporter_secret

    @property
    def ctx(self) -> AEADInterface:
        return self._ctx

    @property
    def key(self) -> bytes:
        return self._key

    @property
    def base_nonce(self) -> bytes:
        return self._base_nonce

    @property
    def seq(self) -> int:
        return self._seq

    @property
    def exporter_secret(self) -> bytes:
        return self._exporter_secret
