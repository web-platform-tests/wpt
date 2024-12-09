from .context_interface import ContextInterface
from .exceptions import NotSupportedError
from .kdf import KDF


class ExporterContext(ContextInterface):
    def __init__(self, kdf: KDF, exporter_secret: bytes):
        self._kdf = kdf
        self._exporter_secret = exporter_secret
        return

    def seal(self, pt: bytes, aad: bytes = b"") -> bytes:
        raise NotSupportedError("Not available on export-only mode.")

    def open(self, ct: bytes, aad: bytes = b"") -> bytes:
        raise NotSupportedError("Not available on export-only mode.")

    def export(self, exporter_context: bytes, length: int) -> bytes:
        return self._kdf.labeled_expand(self._exporter_secret, b"sec", exporter_context, length)
