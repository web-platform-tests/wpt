Server
======

.. automodule:: websockets.server

asyncio
-------

Starting a server
.................

.. autofunction:: serve(ws_handler, host=None, port=None, *, create_protocol=None, logger=None, compression="deflate", origins=None, extensions=None, subprotocols=None, extra_headers=None, process_request=None, select_subprotocol=None, ping_interval=20, ping_timeout=20, close_timeout=10, max_size=2 ** 20, max_queue=2 ** 5, read_limit=2 ** 16, write_limit=2 ** 16, **kwds)
    :async:

.. autofunction:: unix_serve(ws_handler, path=None, *, create_protocol=None, logger=None, compression="deflate", origins=None, extensions=None, subprotocols=None, extra_headers=None, process_request=None, select_subprotocol=None, ping_interval=20, ping_timeout=20, close_timeout=10, max_size=2 ** 20, max_queue=2 ** 5, read_limit=2 ** 16, write_limit=2 ** 16, **kwds)
    :async:

Stopping a server
.................

.. autoclass:: WebSocketServer

    .. automethod:: close

    .. automethod:: wait_closed

    .. automethod:: get_loop

    .. automethod:: is_serving

    .. automethod:: start_serving

    .. automethod:: serve_forever

    .. autoattribute:: sockets

Using a connection
..................

.. autoclass:: WebSocketServerProtocol(ws_handler, ws_server, *, logger=None, origins=None, extensions=None, subprotocols=None, extra_headers=None, process_request=None, select_subprotocol=None, ping_interval=20, ping_timeout=20, close_timeout=10, max_size=2 ** 20, max_queue=2 ** 5, read_limit=2 ** 16, write_limit=2 ** 16)

    .. automethod:: recv

    .. automethod:: send

    .. automethod:: close

    .. automethod:: wait_closed

    .. automethod:: ping

    .. automethod:: pong

    You can customize the opening handshake in a subclass by overriding these methods:

    .. automethod:: process_request

    .. automethod:: select_subprotocol

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


Basic authentication
....................

.. automodule:: websockets.auth

websockets supports HTTP Basic Authentication according to
:rfc:`7235` and :rfc:`7617`.

.. autofunction:: basic_auth_protocol_factory

.. autoclass:: BasicAuthWebSocketServerProtocol

    .. autoattribute:: realm

    .. autoattribute:: username

    .. automethod:: check_credentials

.. currentmodule:: websockets.server

Sans-I/O
--------

.. autoclass:: ServerConnection(origins=None, extensions=None, subprotocols=None, state=State.CONNECTING, max_size=2 ** 20, logger=None)

    .. automethod:: receive_data

    .. automethod:: receive_eof

    .. automethod:: accept

    .. automethod:: reject

    .. automethod:: send_response

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
