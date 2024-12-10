from .encryption_context import EncryptionContext
from .exceptions import NotSupportedError, SealError


class SenderContext(EncryptionContext):
    def seal(self, pt: bytes, aad: bytes = b"") -> bytes:
        try:
            return self._key.seal(pt, self._next_nonce(), aad)
        except Exception as err:
            raise SealError("Failed to seal.") from err

    def open(self, ct: bytes, aad: bytes = b"") -> bytes:
        raise NotSupportedError("Not available for sender.")
