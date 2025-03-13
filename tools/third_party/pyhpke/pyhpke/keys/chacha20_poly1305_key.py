from cryptography.hazmat.primitives.ciphers import aead

from ..aead_key_interface import AEADKeyInterface


class ChaCha20Poly1305Key(AEADKeyInterface):
    """
    The ChaCha20-Poly1305 key.
    """

    def __init__(self, key: bytes):
        if len(key) != 32:
            raise ValueError(f"Invalid key size: {len(key)}.")
        self._ctx = aead.ChaCha20Poly1305(key)

    def seal(self, pt: bytes, nonce: bytes, aad: bytes = b"") -> bytes:
        return self._ctx.encrypt(nonce, pt, aad)

    def open(self, ct: bytes, nonce: bytes, aad: bytes = b"") -> bytes:
        return self._ctx.decrypt(nonce, ct, aad)
