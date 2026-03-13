from .aead_key_interface import AEADKeyInterface
from .consts import AEADId
from .keys.aes_gcm_key import AESGCMKey
from .keys.chacha20_poly1305_key import ChaCha20Poly1305Key


class AEADKey:
    """
    A :class:`AEADKeyInterface <hpke.AEADKeyInterface>` Builder.
    """

    @classmethod
    def from_bytes(cls, aead_id: AEADId, data: bytes) -> AEADKeyInterface:
        """
        Creates an AEAD key from a byte string.
        """
        if aead_id == AEADId.AES128_GCM:
            return AESGCMKey(data, 16)
        if aead_id == AEADId.AES256_GCM:
            return AESGCMKey(data, 32)
        if aead_id == AEADId.CHACHA20_POLY1305:
            return ChaCha20Poly1305Key(data)
        raise ValueError(f"Unsupported or unknown AEAD id: {aead_id}.")
