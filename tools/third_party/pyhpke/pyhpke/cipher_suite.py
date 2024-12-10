import struct
from typing import Optional, Tuple

from .aead import AEAD, AEADParams
from .aead_interface import AEADInterface
from .consts import AEADId, KDFId, KEMId, Mode
from .context_interface import ContextInterface
from .exporter_context import ExporterContext
from .kdf import KDF
from .kdf_interface import KDFInterface
from .kem import KEM
from .kem_interface import KEMInterface
from .kem_key import KEMKeyPair
from .kem_key_interface import KEMKeyInterface
from .recipient_context import RecipientContext
from .sender_context import SenderContext


class CipherSuite(object):
    """
    An HPKE cipher suite which consists of KEM, KDF and AEAD.
    """

    def __init__(self, kem: KEMInterface, kdf: KDFInterface, aead: AEADInterface):
        self._kem = kem
        self._kdf = kdf
        self._aead = aead
        return

    @classmethod
    def new(cls, kem_id: KEMId, kdf_id: KDFId, aead_id: AEADId) -> "CipherSuite":
        """
        Constructor of HPKE cipher suite.

        Args:
            kem_id (KEMId): A KEM (Key Encapsulation Mechanism) identifier.
            kdf_id (KDFId): A KDF (Key Derivation Function) identifier.
            aead_id (AEADId): An AEAD (Authenticated Encryption with Additional Data) identifier.
        Returns:
            CipherSuite: A CipherSuite object.
        """
        suite_id = b"HPKE" + struct.pack(">HHH", kem_id.value, kdf_id.value, aead_id.value)
        kem = KEM(kem_id)
        kdf = KDF(kdf_id, suite_id)
        aead = AEAD(aead_id)
        return cls(kem, kdf, aead)

    @property
    def kem(self) -> KEMInterface:
        """
        The KEM context in the cipher suite.
        """
        return self._kem

    @property
    def kdf(self) -> KDFInterface:
        """
        The KDF context in the cipher suite.
        """
        return self._kdf

    @property
    def aead(self) -> AEADInterface:
        """
        The AEAD context in the cipher suite.
        """
        return self._aead

    def create_sender_context(
        self,
        pkr: KEMKeyInterface,
        info: bytes = b"",
        sks: Optional[KEMKeyInterface] = None,
        psk: bytes = b"",
        psk_id: bytes = b"",
        eks: Optional[KEMKeyPair] = None,
    ) -> Tuple[bytes, ContextInterface]:
        """
        Creates a sender context.
        """
        mode: Mode = Mode.BASE
        if psk == b"":
            mode = Mode.BASE if sks is None else Mode.AUTH
        else:
            mode = Mode.PSK if sks is None else Mode.AUTH_PSK

        shared_secret, enc = self._kem.encap(pkr, sks, eks)
        return enc, self._key_schedule_s(mode, shared_secret, info, psk, psk_id)

    def create_recipient_context(
        self,
        enc: bytes,
        skr: KEMKeyInterface,
        info: bytes = b"",
        pks: Optional[KEMKeyInterface] = None,
        psk: bytes = b"",
        psk_id: bytes = b"",
    ) -> ContextInterface:
        """
        Creates a recipient context.
        """
        mode: Mode = Mode.BASE
        if psk == b"":
            mode = Mode.BASE if pks is None else Mode.AUTH
        else:
            mode = Mode.PSK if pks is None else Mode.AUTH_PSK

        shared_secret = self._kem.decap(enc, skr, pks)
        return self._key_schedule_r(mode, shared_secret, info, psk, psk_id)

    def seal(
        self,
        pkr: KEMKeyInterface,
        pt: bytes,
        info: bytes = b"",
        aad: bytes = b"",
        psk: bytes = b"",
        psk_id: bytes = b"",
        sks: Optional[KEMKeyInterface] = None,
    ) -> Tuple[bytes, bytes]:
        """
        Does a single-shot encryption.
        """
        raise NotImplementedError()

    def open(
        self,
        enc: bytes,
        skr: KEMKeyInterface,
        ct: bytes,
        info: bytes = b"",
        aad: bytes = b"",
        psk: bytes = b"",
        psk_id: bytes = b"",
        pks: Optional[KEMKeyInterface] = None,
    ) -> bytes:
        """
        Does a single-shot decryption.
        """
        raise NotImplementedError()

    def _key_schedule(
        self,
        mode: Mode,
        shared_secret: bytes,
        info: bytes,
        psk: bytes,
        psk_id: bytes,
    ) -> Tuple[KDF, AEADParams]:
        suite_id = b"HPKE" + struct.pack(">HHH", self._kem.id.value, self._kdf.id.value, self._aead.id.value)
        kdf = KDF(self._kdf.id, suite_id)

        psk_id_hash = kdf.labeled_extract(b"", b"psk_id_hash", psk_id)
        info_hash = kdf.labeled_extract(b"", b"info_hash", info)
        key_schedule_context = bytes([mode.value]) + psk_id_hash + info_hash

        secret = kdf.labeled_extract(shared_secret, b"secret", psk)

        key = kdf.labeled_expand(secret, b"key", key_schedule_context, self._aead.key_size)
        base_nonce = kdf.labeled_expand(secret, b"base_nonce", key_schedule_context, self._aead.nonce_size)
        exporter_secret = kdf.labeled_expand(secret, b"exp", key_schedule_context, kdf.digest_size)
        return kdf, AEADParams(self._aead, key, base_nonce, 0, exporter_secret)

    def _key_schedule_s(
        self,
        mode: Mode,
        shared_secret: bytes,
        info: bytes,
        psk: bytes,
        psk_id: bytes,
    ) -> ContextInterface:
        kdf, params = self._key_schedule(mode, shared_secret, info, psk, psk_id)
        if params.key == b"":
            return ExporterContext(kdf, params.exporter_secret)
        return SenderContext(kdf, params)

    def _key_schedule_r(
        self,
        mode: Mode,
        shared_secret: bytes,
        info: bytes,
        psk: bytes,
        psk_id: bytes,
    ) -> ContextInterface:
        kdf, params = self._key_schedule(mode, shared_secret, info, psk, psk_id)
        if params.key == b"":
            return ExporterContext(kdf, params.exporter_secret)
        return RecipientContext(kdf, params)
