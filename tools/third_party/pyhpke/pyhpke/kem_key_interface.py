from typing import Any


class KEMKeyInterface:
    """
    The KEM key interface.
    """

    def __init__(self, key: Any):
        self._key = key

    @property
    def raw(self) -> Any:
        return self._key

    def to_private_bytes(self) -> bytes:
        """
        Serializes the key to a byte string if it is private.
        """
        raise NotImplementedError()

    def to_public_bytes(self) -> bytes:
        """
        Serializes the key to a byte string if it is public.
        """
        raise NotImplementedError()
