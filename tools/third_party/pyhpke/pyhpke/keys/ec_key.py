from typing import Any, Dict

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.ec import (
    EllipticCurvePrivateKey,
    EllipticCurvePublicKey,
)
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

from ..consts import HPKE_SUPPORTED_JWK_EC_CRVS
from ..kem_key_interface import KEMKeyInterface
from ..utils import base64url_decode


class ECKey(KEMKeyInterface):
    """
    The EC key for KEM.
    """

    def __init__(self, key: Any):
        if isinstance(key, EllipticCurvePrivateKey):
            self._is_public = False
        elif isinstance(key, EllipticCurvePublicKey):
            self._is_public = True
        else:
            raise ValueError("Unsupported key object for EC.")
        super().__init__(key)

    @classmethod
    def from_private_bytes(cls, crv: Any, key: bytes) -> KEMKeyInterface:
        return cls(ec.derive_private_key(int.from_bytes(key, byteorder="big"), crv))

    @classmethod
    def from_public_bytes(cls, crv: Any, key: bytes) -> KEMKeyInterface:
        return cls(ec.EllipticCurvePublicKey.from_encoded_point(crv, key))

    @classmethod
    def from_jwk(cls, jwk: Dict[str, Any]) -> KEMKeyInterface:
        """
        Creates an EC key from JWK (JSON Web Key).
        """
        if "kty" not in jwk or jwk["kty"] != "EC":
            raise ValueError(f"kty is not EC: {jwk['kty']}.")

        if "x" not in jwk:
            raise ValueError("x is not found.")
        if "y" not in jwk:
            raise ValueError("y is not found.")
        x = base64url_decode(jwk["x"])
        y = base64url_decode(jwk["y"])

        if "crv" not in jwk or jwk["crv"] not in HPKE_SUPPORTED_JWK_EC_CRVS:
            raise ValueError(f"Unknown crv: {jwk['crv']}.")
        if jwk["crv"] == "P-256":
            if len(x) == len(y) == 32:
                crv = ec.SECP256R1()
            else:
                raise ValueError("Coords should be 32 bytes for curve P-256")
        elif jwk["crv"] == "P-384":
            if len(x) == len(y) == 48:
                crv = ec.SECP384R1()
            else:
                raise ValueError("Coords should be 48 bytes for curve P-384")
        elif jwk["crv"] == "P-521":
            if len(x) == len(y) == 66:
                crv = ec.SECP521R1()
            else:
                raise ValueError("Coords should be 66 bytes for curve P-521")
        else:
            raise ValueError(f"Invalid curve: {jwk['crv']}.")

        public_numbers = ec.EllipticCurvePublicNumbers(
            x=int.from_bytes(x, byteorder="big"),
            y=int.from_bytes(y, byteorder="big"),
            curve=crv,
        )

        if "d" not in jwk:
            return cls(public_numbers.public_key())

        d = base64url_decode(jwk["d"])
        if len(d) != len(x):
            raise ValueError(f"D should be {len(x)} bytes for curve {jwk['crv']}")

        return cls(ec.EllipticCurvePrivateNumbers(int.from_bytes(d, byteorder="big"), public_numbers).private_key())

    def to_private_bytes(self) -> bytes:
        if self._is_public:
            raise ValueError("The key is public")
        private_value = self._key.private_numbers().private_value  # type: int
        return private_value.to_bytes(self._key.key_size, "big")

    def to_public_bytes(self) -> bytes:
        """
        Serializes the key to a byte string.
        """
        if not self._is_public:
            raise ValueError("The key is private.")
        return self._key.public_bytes(encoding=Encoding.X962, format=PublicFormat.UncompressedPoint)
