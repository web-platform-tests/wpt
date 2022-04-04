Utilities
=========

Broadcast
---------

.. autofunction:: websockets.broadcast

WebSocket events
----------------

.. automodule:: websockets.frames

    .. autoclass:: Frame

    .. autoclass:: Opcode

        .. autoattribute:: CONT

        .. autoattribute:: TEXT

        .. autoattribute:: BINARY

        .. autoattribute:: CLOSE

        .. autoattribute:: PING

        .. autoattribute:: PONG

    .. autoclass:: Close

HTTP events
-----------

.. automodule:: websockets.http11

    .. autoclass:: Request

    .. autoclass:: Response

.. automodule:: websockets.datastructures

    .. autoclass:: Headers

        .. automethod:: get_all

        .. automethod:: raw_items

    .. autoexception:: MultipleValuesError

URIs
----

.. automodule:: websockets.uri

    .. autofunction:: parse_uri

    .. autoclass:: WebSocketURI
