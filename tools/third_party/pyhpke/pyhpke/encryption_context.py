from .aead import AEADParams
from .exporter_context import ExporterContext
from .kdf import KDF
from .utils import xor_bytes


class EncryptionContext(ExporterContext):
    def __init__(self, kdf: KDF, aead_params: AEADParams):
        self._key = aead_params.ctx.import_key(aead_params.key)
        self._seq = aead_params.seq
        self._nonce = aead_params.base_nonce
        self._nn = aead_params.ctx.nonce_size
        super().__init__(kdf, aead_params.exporter_secret)
        return

    def _next_nonce(self):
        nonce = xor_bytes(self._nonce, self._seq.to_bytes(self._nn, byteorder="big"))
        self._seq += 1
        return nonce
