from cryptography.hazmat.primitives.ciphers import aead

from ..aead_key_interface import AEADKeyInterface


class AESGCMKey(AEADKeyInterface):
    """
    The AES-GCM key.
    """

    def __init__(self, key: bytes, size: int):
        if size != 16 and size != 32:
            raise ValueError(f"Invalid key size: {len(key)}.")
        if len(key) != size:
            raise ValueError("Key size mismatch.")
        self._ctx = aead.AESGCM(key)

    def seal(self, pt: bytes, nonce: bytes, aad: bytes = b"") -> bytes:
        return self._ctx.encrypt(nonce, pt, aad)

    def open(self, ct: bytes, nonce: bytes, aad: bytes = b"") -> bytes:
        return self._ctx.decrypt(nonce, ct, aad)
