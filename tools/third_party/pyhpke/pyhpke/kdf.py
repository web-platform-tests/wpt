import struct
from typing import Any

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, hmac

from .consts import HPKE_VERSION, KDFId
from .kdf_interface import KDFInterface


class KDF(KDFInterface):
    """
    A KDF(Key Derivation Function) context.
    """

    def __init__(self, kdf_id: KDFId, suite_id: bytes):
        h: Any = None

        if kdf_id == KDFId.HKDF_SHA256:
            h = hashes.SHA256()
        elif kdf_id == KDFId.HKDF_SHA384:
            h = hashes.SHA384()
        elif kdf_id == KDFId.HKDF_SHA512:
            h = hashes.SHA512()
        else:
            raise ValueError(f"Unsupported or unknown KDF id: {kdf_id}.")

        self._id = kdf_id
        self._hash = h
        self._suite_id = suite_id
        return

    @property
    def id(self) -> KDFId:
        """
        The KDF identifier.
        """
        return self._id

    @property
    def digest_size(self) -> int:
        return self._hash.digest_size

    def extract(self, salt: bytes, ikm: bytes) -> bytes:
        ctx = hmac.HMAC(salt, self._hash, backend=default_backend())
        ctx.update(ikm)
        return ctx.finalize()

    def expand(self, prk: bytes, info: bytes, length: int) -> bytes:
        assert length <= 255 * self._hash.digest_size

        t_n_minus_1 = b""
        n = 1
        data = b""

        while len(data) < length:
            ctx = hmac.HMAC(prk, self._hash, backend=default_backend())
            ctx.update(t_n_minus_1 + info + n.to_bytes(1, byteorder="big"))
            t_n_minus_1 = ctx.finalize()
            data += t_n_minus_1
            n += 1
        return data[:length]

    def extract_and_expand(self, salt: bytes, ikm: bytes, info: bytes, length: int) -> bytes:
        return self.expand(self.extract(salt, ikm), info, length)

    def labeled_extract(self, salt: bytes, label: bytes, ikm: bytes) -> bytes:
        labeled_ikm = HPKE_VERSION + self._suite_id + label + ikm
        return self.extract(salt, labeled_ikm)

    def labeled_expand(self, prk: bytes, label: bytes, info: bytes, length: int) -> bytes:
        labeled_info = struct.pack(">H", length) + HPKE_VERSION + self._suite_id + label + info
        return self.expand(prk, labeled_info, length)
