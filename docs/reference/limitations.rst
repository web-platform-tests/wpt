Limitations
===========

.. currentmodule:: websockets

Client
------

The client doesn't attempt to guarantee that there is no more than one
connection to a given IP address in a CONNECTING state. This behavior is
`mandated by RFC 6455`_. However, :func:`~client.connect()` isn't the
right layer for enforcing this constraint. It's the caller's responsibility.

.. _mandated by RFC 6455: https://www.rfc-editor.org/rfc/rfc6455.html#section-4.1

The client doesn't support connecting through a HTTP proxy (`issue 364`_) or a
SOCKS proxy (`issue 475`_).

.. _issue 364: https://github.com/aaugustin/websockets/issues/364
.. _issue 475: https://github.com/aaugustin/websockets/issues/475

Server
------

At this time, there are no known limitations affecting only the server.

Both sides
----------

There is no way to control compression of outgoing frames on a per-frame basis
(`issue 538`_). If compression is enabled, all frames are compressed.

.. _issue 538: https://github.com/aaugustin/websockets/issues/538

There is no way to receive each fragment of a fragmented messages as it
arrives (`issue 479`_). websockets always reassembles fragmented messages
before returning them.

.. _issue 479: https://github.com/aaugustin/websockets/issues/479
