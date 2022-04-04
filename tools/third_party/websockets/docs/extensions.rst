Extensions
==========

.. currentmodule:: websockets.extensions

The WebSocket protocol supports extensions_.

At the time of writing, there's only one `registered extension`_ with a public
specification, WebSocket Per-Message Deflate, specified in :rfc:`7692`.

.. _extensions: https://tools.ietf.org/html/rfc6455#section-9
.. _registered extension: https://www.iana.org/assignments/websocket/websocket.xhtml#extension-name

Per-Message Deflate
-------------------

:func:`~websockets.client.connect` and :func:`~websockets.server.serve` enable
the Per-Message Deflate extension by default.

If you want to disable it, set ``compression=None``::

    import websockets

    websockets.connect(..., compression=None)

    websockets.serve(..., compression=None)


.. _per-message-deflate-configuration-example:

You can also configure the Per-Message Deflate extension explicitly if you
want to customize compression settings::

    import websockets
    from websockets.extensions import permessage_deflate

    websockets.connect(
        ...,
        extensions=[
            permessage_deflate.ClientPerMessageDeflateFactory(
                server_max_window_bits=11,
                client_max_window_bits=11,
                compress_settings={'memLevel': 4},
            ),
        ],
    )

    websockets.serve(
        ...,
        extensions=[
            permessage_deflate.ServerPerMessageDeflateFactory(
                server_max_window_bits=11,
                client_max_window_bits=11,
                compress_settings={'memLevel': 4},
            ),
        ],
    )

The window bits and memory level values chosen in these examples reduce memory
usage. You can read more about :ref:`optimizing compression settings
<compression-settings>`.

Refer to the API documentation of
:class:`~permessage_deflate.ClientPerMessageDeflateFactory` and
:class:`~permessage_deflate.ServerPerMessageDeflateFactory` for details.

Writing an extension
--------------------

During the opening handshake, WebSocket clients and servers negotiate which
extensions will be used with which parameters. Then each frame is processed by
extensions before being sent or after being received.

As a consequence, writing an extension requires implementing several classes:

* Extension Factory: it negotiates parameters and instantiates the extension.

  Clients and servers require separate extension factories with distinct APIs.

  Extension factories are the public API of an extension.

* Extension: it decodes incoming frames and encodes outgoing frames.

  If the extension is symmetrical, clients and servers can use the same
  class.

  Extensions are initialized by extension factories, so they don't need to be
  part of the public API of an extension.

``websockets`` provides abstract base classes for extension factories and
extensions. See the API documentation for details on their methods:

* :class:`ClientExtensionFactory` and class:`ServerExtensionFactory` for
  :extension factories,
* :class:`Extension` for extensions.


