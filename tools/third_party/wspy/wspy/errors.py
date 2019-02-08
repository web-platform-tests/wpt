class SocketClosed(Exception):
    def __init__(self, initialized):
        self.initialized = initialized

    @property
    def message(self):
        s = 'socket closed'

        if self.initialized:
            s += ' (initialized)'

        return s


class HandshakeError(Exception):
    pass


class PingError(Exception):
    pass


class SSLError(Exception):
    pass
