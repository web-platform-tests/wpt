from __future__ import unicode_literals

import platform

from ._version import __version__

# A constant used in websocket handshake
# Note, this isn't anything that needs to be secured.
# See https://tools.ietf.org/html/rfc6455#page-7
WS_KEY = b'258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

# Standard since 2011
# https://tools.ietf.org/html/rfc6455
WS_VERSION = 13

# User agent sent with websocket request
USER_AGENT = 'Lomond/{} {}/{} {}/{} ({})'.format(
    __version__,
    platform.python_implementation(),
    platform.python_version(),
    platform.system(),
    platform.release(),
    platform.platform()
)
