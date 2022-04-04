from websockets.exceptions import NegotiationError
from websockets.extensions.base import *  # noqa


# Abstract classes don't provide any behavior to test.


class ClientNoOpExtensionFactory:
    name = "x-no-op"

    def get_request_params(self):
        return []

    def process_response_params(self, params, accepted_extensions):
        if params:
            raise NegotiationError()
        return NoOpExtension()


class ServerNoOpExtensionFactory:
    name = "x-no-op"

    def __init__(self, params=None):
        self.params = params or []

    def process_request_params(self, params, accepted_extensions):
        return self.params, NoOpExtension()


class NoOpExtension:
    name = "x-no-op"

    def __repr__(self):
        return "NoOpExtension()"

    def decode(self, frame, *, max_size=None):
        return frame

    def encode(self, frame):
        return frame
