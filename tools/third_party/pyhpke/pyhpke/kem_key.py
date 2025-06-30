import json
from typing import Any, Dict, Union

from cryptography.hazmat.primitives.asymmetric.ec import (
    EllipticCurvePrivateKey,
    EllipticCurvePublicKey,
)
from cryptography.hazmat.primitives.asymmetric.x448 import X448PrivateKey, X448PublicKey
from cryptography.hazmat.primitives.asymmetric.x25519 import (
    X25519PrivateKey,
    X25519PublicKey,
)
from cryptography.hazmat.primitives.serialization import (
    load_pem_private_key,
    load_pem_public_key,
)

from .consts import HPKE_SUPPORTED_JWK_KTYS
from .kem_key_interface import KEMKeyInterface
from .keys.ec_key import ECKey
from .keys.x448_key import X448Key
from .keys.x25519_key import X25519Key


class KEMKey:
    """
    A :class:`KEMKeyInterface <pyhpke.KEMKeyInterface>` Builder.
    """

    @classmethod
    def from_pyca_cryptography_key(cls, k: Any) -> KEMKeyInterface:
        """
        Creates an HPKE key from `pyca/cryptography` key object.
        """
        if isinstance(k, EllipticCurvePrivateKey) or isinstance(k, EllipticCurvePublicKey):
            return ECKey(k)
        elif isinstance(k, X25519PrivateKey) or isinstance(k, X25519PublicKey):
            return X25519Key(k)
        elif isinstance(k, X448PrivateKey) or isinstance(k, X448PublicKey):
            return X448Key(k)
        raise ValueError("Unsupported or unknown key.")

    @classmethod
    def from_jwk(cls, data: Union[bytes, str, Dict[str, Any]]) -> KEMKeyInterface:
        """
        Creates an HPKE key from JWK (JSON Web Key).
        """
        jwk: Dict[str, Any]
        if not isinstance(data, dict):
            jwk = json.loads(data)
        else:
            jwk = data
        if "kty" not in jwk:
            raise ValueError("kty not found.")

        if jwk["kty"] not in HPKE_SUPPORTED_JWK_KTYS:
            raise ValueError(f"Unknown kty: {jwk['kty']}.")
        if jwk["kty"] == "EC":
            return ECKey.from_jwk(jwk)
        if jwk["kty"] == "OKP":
            if "crv" not in jwk:
                raise ValueError("crv not found.")
            if jwk["crv"] == "X25519":
                return X25519Key.from_jwk(jwk)
            if jwk["crv"] == "X448":
                return X448Key.from_jwk(jwk)
            raise ValueError(f"Unsupported or unknown crv: {jwk['crv']}.")
        raise ValueError("Unsupported or unknown key.")

    @classmethod
    def from_pem(cls, data: Union[bytes, str]) -> KEMKeyInterface:
        """
        Creates an HPKE key from PEM-formatted key data.
        """
        if isinstance(data, str):
            data = data.encode("utf-8")
        data_str = data.decode("utf-8")

        k: Any = None
        if "BEGIN PUBLIC" in data_str:
            k = load_pem_public_key(data)
        elif "BEGIN PRIVATE" in data_str:
            k = load_pem_private_key(data, password=None)
        elif "BEGIN EC PRIVATE" in data_str:
            k = load_pem_private_key(data, password=None)
        else:
            raise ValueError("Failed to decode PEM.")
        return cls.from_pyca_cryptography_key(k)


class KEMKeyPair(object):
    def __init__(self, sk: KEMKeyInterface, pk: KEMKeyInterface):
        self._sk = sk
        self._pk = pk
        return

    @property
    def private_key(self) -> KEMKeyInterface:
        return self._sk

    @property
    def public_key(self) -> KEMKeyInterface:
        return self._pk
