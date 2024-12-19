from typing import Any, Dict

from cryptography.hazmat.primitives.asymmetric.x25519 import (
    X25519PrivateKey,
    X25519PublicKey,
)
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

from ..kem_key_interface import KEMKeyInterface
from ..utils import base64url_decode


class X25519Key(KEMKeyInterface):
    """
    The X25519 key for KEM.
    """

    def __init__(self, key: Any):
        if isinstance(key, X25519PrivateKey):
            self._is_public = False
        elif isinstance(key, X25519PublicKey):
            self._is_public = True
        else:
            raise ValueError("Unsupported key object for EC.")
        super().__init__(key)

    @classmethod
    def from_private_bytes(cls, key: bytes) -> KEMKeyInterface:
        return cls(X25519PrivateKey.from_private_bytes(key))

    @classmethod
    def from_public_bytes(cls, key: bytes) -> KEMKeyInterface:
        return cls(X25519PublicKey.from_public_bytes(key))

    @classmethod
    def from_jwk(cls, jwk: Dict[str, Any]) -> KEMKeyInterface:
        """
        Creates an EC key from JWK (JSON Web Key).
        """
        if "kty" not in jwk or jwk["kty"] != "OKP":
            raise ValueError(f"kty is not OKP: {jwk['kty']}.")

        if "x" not in jwk:
            raise ValueError("x is not found.")
        x = base64url_decode(jwk["x"])
        if len(x) != 32:
            raise ValueError("Coords should be 32 bytes for X25519.")

        if "crv" not in jwk or jwk["crv"] != "X25519":
            raise ValueError(f"Unknown crv: {jwk['crv']}.")

        if "d" not in jwk:
            return cls(X25519PublicKey.from_public_bytes(x))

        d = base64url_decode(jwk["d"])
        if len(d) != len(x):
            raise ValueError(f"D should be {len(x)} bytes for {jwk['crv']}")
        return cls(X25519PrivateKey.from_private_bytes(d))

    def to_private_bytes(self) -> bytes:
        if self._is_public:
            raise ValueError("The key is public")
        return self._key.private_bytes_raw()

    def to_public_bytes(self) -> bytes:
        """
        Serializes the key to a byte string.
        """
        if not self._is_public:
            raise ValueError("The key is private.")
        return self._key.public_bytes(Encoding.Raw, PublicFormat.Raw)
