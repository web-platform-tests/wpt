Client
======

.. automodule:: websockets.client

asyncio
-------

Opening a connection
....................

.. autofunction:: connect(uri, *, create_protocol=None, logger=None, compression="deflate", origin=None, extensions=None, subprotocols=None, extra_headers=None, open_timeout=10, ping_interval=20, ping_timeout=20, close_timeout=10, max_size=2 ** 20, max_queue=2 ** 5, read_limit=2 ** 16, write_limit=2 ** 16, **kwds)
    :async:

.. autofunction:: unix_connect(path, uri="ws://localhost/", *, create_protocol=None, logger=None, compression="deflate", origin=None, extensions=None, subprotocols=None, extra_headers=None, open_timeout=10, ping_interval=20, ping_timeout=20, close_timeout=10, max_size=2 ** 20, max_queue=2 ** 5, read_limit=2 ** 16, write_limit=2 ** 16, **kwds)
    :async:

Using a connection
..................

.. autoclass:: WebSocketClientProtocol(*, logger=None, origin=None, extensions=None, subprotocols=None, extra_headers=None, ping_interval=20, ping_timeout=20, close_timeout=10, max_size=2 ** 20, max_queue=2 ** 5, read_limit=2 ** 16, write_limit=2 ** 16)

    .. automethod:: recv

    .. automethod:: send

    .. automethod:: close

    .. automethod:: wait_closed

    .. automethod:: ping

    .. automethod:: pong

    WebSocket connection objects also provide these attributes:

    .. autoattribute:: id

    .. autoattribute:: logger

    .. autoproperty:: local_address

    .. autoproperty:: remote_address

    .. autoproperty:: open

    .. autoproperty:: closed

    The following attributes are available after the opening handshake,
    once the WebSocket connection is open:

    .. autoattribute:: path

    .. autoattribute:: request_headers

    .. autoattribute:: response_headers

    .. autoattribute:: subprotocol

    The following attributes are available after the closing handshake,
    once the WebSocket connection is closed:

    .. autoproperty:: close_code

    .. autoproperty:: close_reason

Sans-I/O
--------

.. autoclass:: ClientConnection(wsuri, origin=None, extensions=None, subprotocols=None, state=State.CONNECTING, max_size=2 ** 20, logger=None)

    .. automethod:: receive_data

    .. automethod:: receive_eof

    .. automethod:: connect

    .. automethod:: send_request

    .. automethod:: send_continuation

    .. automethod:: send_text

    .. automethod:: send_binary

    .. automethod:: send_close

    .. automethod:: send_ping

    .. automethod:: send_pong

    .. automethod:: fail

    .. automethod:: events_received

    .. automethod:: data_to_send

    .. automethod:: close_expected

    .. autoattribute:: id

    .. autoattribute:: logger

    .. autoproperty:: state

    .. autoproperty:: close_code

    .. autoproperty:: close_reason

    .. autoproperty:: close_exc
