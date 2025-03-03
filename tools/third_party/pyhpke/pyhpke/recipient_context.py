from .encryption_context import EncryptionContext
from .exceptions import NotSupportedError, OpenError


class RecipientContext(EncryptionContext):
    def seal(self, pt: bytes, aad: bytes = b"") -> bytes:
        raise NotSupportedError("Not available for recipient.")

    def open(self, ct: bytes, aad: bytes = b"") -> bytes:
        try:
            return self._key.open(ct, self._next_nonce(), aad)
        except Exception as err:
            raise OpenError("Failed to open.") from err
