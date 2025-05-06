from typing import Any, Dict

from cryptography.hazmat.primitives.asymmetric.x448 import X448PrivateKey, X448PublicKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

from ..kem_key_interface import KEMKeyInterface
from ..utils import base64url_decode


class X448Key(KEMKeyInterface):
    """
    The X448 key for KEM.
    """

    def __init__(self, key: Any):
        if isinstance(key, X448PrivateKey):
            self._is_public = False
        elif isinstance(key, X448PublicKey):
            self._is_public = True
        else:
            raise ValueError("Unsupported key object for EC.")
        super().__init__(key)

    @classmethod
    def from_private_bytes(cls, key: bytes) -> KEMKeyInterface:
        return cls(X448PrivateKey.from_private_bytes(key))

    @classmethod
    def from_public_bytes(cls, key: bytes) -> KEMKeyInterface:
        return cls(X448PublicKey.from_public_bytes(key))

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
        if len(x) != 56:
            raise ValueError("Coords should be 56 bytes for X448.")

        if "crv" not in jwk or jwk["crv"] != "X448":
            raise ValueError(f"Unknown crv: {jwk['crv']}.")

        if "d" not in jwk:
            return cls(X448PublicKey.from_public_bytes(x))

        d = base64url_decode(jwk["d"])
        if len(d) != len(x):
            raise ValueError(f"D should be {len(x)} bytes for {jwk['crv']}")
        return cls(X448PrivateKey.from_private_bytes(d))

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
