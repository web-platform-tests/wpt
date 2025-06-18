class ContextInterface(object):
    def seal(self, pt: bytes, aad: bytes = b"") -> bytes:
        raise NotImplementedError()

    def open(self, ct: bytes, aad: bytes = b"") -> bytes:
        raise NotImplementedError()

    def export(self, exporter_context: bytes, length: int) -> bytes:
        raise NotImplementedError()
