from .consts import KDFId


class KDFInterface(object):
    """
    The KDF (Key Derivation Function) interface.
    """

    @property
    def id(self) -> KDFId:
        """
        The KDF identifier.
        """
        raise NotImplementedError()

    def extract(self, salt: bytes, ikm: bytes) -> bytes:
        raise NotImplementedError()

    def expand(self, prk: bytes, info: bytes, length: int) -> bytes:
        raise NotImplementedError()

    # def extract_and_expand(self, salt: bytes, ikm: bytes, info: bytes, length: int) -> bytes:
    #     raise NotImplementedError()

    # def labeled_extract(self, salt: bytes, label: bytes, ikm: bytes) -> bytes:
    #     raise NotImplementedError()
    #
    # def labeled_expand(self, prk: bytes, label: bytes, info: bytes, length: int) -> bytes:
    #     raise NotImplementedError()
