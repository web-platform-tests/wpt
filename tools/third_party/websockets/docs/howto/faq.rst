FAQ
===

.. currentmodule:: websockets

.. admonition:: Many questions asked in websockets' issue tracker are really
    about :mod:`asyncio`.
    :class: seealso

    Python's documentation about `developing with asyncio`_ is a good
    complement.

    .. _developing with asyncio: https://docs.python.org/3/library/asyncio-dev.html

Server side
-----------

Why does the server close the connection prematurely?
.....................................................

Your connection handler exits prematurely. Wait for the work to be finished
before returning.

For example, if your handler has a structure similar to::

    async def handler(websocket):
        asyncio.create_task(do_some_work())

change it to::

    async def handler(websocket):
        await do_some_work()

Why does the server close the connection after one message?
...........................................................

Your connection handler exits after processing one message. Write a loop to
process multiple messages.

For example, if your handler looks like this::

    async def handler(websocket):
        print(websocket.recv())

change it like this::

    async def handler(websocket):
        async for message in websocket:
            print(message)

*Don't feel bad if this happens to you — it's the most common question in
websockets' issue tracker :-)*

Why can only one client connect at a time?
..........................................

Your connection handler blocks the event loop. Look for blocking calls.
Any call that may take some time must be asynchronous.

For example, if you have::

    async def handler(websocket):
        time.sleep(1)

change it to::

    async def handler(websocket):
        await asyncio.sleep(1)

This is part of learning asyncio. It isn't specific to websockets.

See also Python's documentation about `running blocking code`_.

.. _running blocking code: https://docs.python.org/3/library/asyncio-dev.html#running-blocking-code

.. _send-message-to-all-users:

How do I send a message to all users?
.....................................

Record all connections in a global variable::

    CONNECTIONS = set()

    async def handler(websocket):
        CONNECTIONS.add(websocket)
        try:
            await websocket.wait_closed()
        finally:
            CONNECTIONS.remove(websocket)

Then, call :func:`~websockets.broadcast`::

    import websockets

    def message_all(message):
        websockets.broadcast(CONNECTIONS, message)

If you're running multiple server processes, make sure you call ``message_all``
in each process.

.. _send-message-to-single-user:

How do I send a message to a single user?
.........................................

Record connections in a global variable, keyed by user identifier::

    CONNECTIONS = {}

    async def handler(websocket):
        user_id = ...  # identify user in your app's context
        CONNECTIONS[user_id] = websocket
        try:
            await websocket.wait_closed()
        finally:
            del CONNECTIONS[user_id]

Then, call :meth:`~legacy.protocol.WebSocketCommonProtocol.send`::

    async def message_user(user_id, message):
        websocket = CONNECTIONS[user_id]  # raises KeyError if user disconnected
        await websocket.send(message)  # may raise websockets.ConnectionClosed

Add error handling according to the behavior you want if the user disconnected
before the message could be sent.

This example supports only one connection per user. To support concurrent
connects by the same user, you can change ``CONNECTIONS`` to store a set of
connections for each user.

If you're running multiple server processes, call ``message_user`` in each
process. The process managing the user's connection sends the message; other
processes do nothing.

When you reach a scale where server processes cannot keep up with the stream of
all messages, you need a better architecture. For example, you could deploy an
external publish / subscribe system such as Redis_. Server processes would
subscribe their clients. Then, they would receive messages only for the
connections that they're managing.

.. _Redis: https://redis.io/

How do I send a message to a channel, a topic, or some users?
.............................................................

websockets doesn't provide built-in publish / subscribe functionality.

Record connections in a global variable, keyed by user identifier, as shown in
:ref:`How do I send a message to a single user?<send-message-to-single-user>`

Then, build the set of recipients and broadcast the message to them, as shown in
:ref:`How do I send a message to all users?<send-message-to-all-users>`

:doc:`django` contains a complete implementation of this pattern.

Again, as you scale, you may reach the performance limits of a basic in-process
implementation. You may need an external publish / subscribe system like Redis_.

.. _Redis: https://redis.io/

How do I pass arguments to the connection handler?
..................................................

You can bind additional arguments to the connection handler with
:func:`functools.partial`::

    import asyncio
    import functools
    import websockets

    async def handler(websocket, extra_argument):
        ...

    bound_handler = functools.partial(handler, extra_argument='spam')
    start_server = websockets.serve(bound_handler, ...)

Another way to achieve this result is to define the ``handler`` coroutine in
a scope where the ``extra_argument`` variable exists instead of injecting it
through an argument.

How do I access HTTP headers?
.............................

To access HTTP headers during the WebSocket handshake, you can override
:attr:`~server.WebSocketServerProtocol.process_request`::

    async def process_request(self, path, request_headers):
        authorization = request_headers["Authorization"]

Once the connection is established, HTTP headers are available in
:attr:`~server.WebSocketServerProtocol.request_headers` and
:attr:`~server.WebSocketServerProtocol.response_headers`::

    async def handler(websocket):
        authorization = websocket.request_headers["Authorization"]

How do I set HTTP headers?
..........................

To set the ``Sec-WebSocket-Extensions`` or ``Sec-WebSocket-Protocol`` headers in
the WebSocket handshake response, use the ``extensions`` or ``subprotocols``
arguments of :func:`~server.serve`.

To set other HTTP headers, use the ``extra_headers`` argument.

How do I get the IP address of the client?
..........................................

It's available in :attr:`~legacy.protocol.WebSocketCommonProtocol.remote_address`::

    async def handler(websocket):
        remote_ip = websocket.remote_address[0]

How do I set the IP addresses my server listens on?
...................................................

Look at the ``host`` argument of :meth:`~asyncio.loop.create_server`.

:func:`~server.serve` accepts the same arguments as
:meth:`~asyncio.loop.create_server`.

What does ``OSError: [Errno 99] error while attempting to bind on address ('::1', 80, 0, 0): address not available`` mean?
..........................................................................................................................

You are calling :func:`~server.serve` without a ``host`` argument in a context
where IPv6 isn't available.

To listen only on IPv4, specify ``host="0.0.0.0"`` or ``family=socket.AF_INET``.

Refer to the documentation of :meth:`~asyncio.loop.create_server` for details.

How do I close a connection?
............................

websockets takes care of closing the connection when the handler exits.

How do I stop a server?
.......................

Exit the :func:`~server.serve` context manager.

Here's an example that terminates cleanly when it receives SIGTERM on Unix:

.. literalinclude:: ../../example/shutdown_server.py
    :emphasize-lines: 12-15,18


How do I run HTTP and WebSocket servers on the same port?
.........................................................

You don't.

HTTP and WebSocket have widely different operational characteristics. Running
them with the same server becomes inconvenient when you scale.

Providing a HTTP server is out of scope for websockets. It only aims at
providing a WebSocket server.

There's limited support for returning HTTP responses with the
:attr:`~server.WebSocketServerProtocol.process_request` hook.

If you need more, pick a HTTP server and run it separately.

Alternatively, pick a HTTP framework that builds on top of ``websockets`` to
support WebSocket connections, like Sanic_.

.. _Sanic: https://sanicframework.org/en/

Client side
-----------

Why does the client close the connection prematurely?
.....................................................

You're exiting the context manager prematurely. Wait for the work to be
finished before exiting.

For example, if your code has a structure similar to::

    async with connect(...) as websocket:
        asyncio.create_task(do_some_work())

change it to::

    async with connect(...) as websocket:
        await do_some_work()

How do I access HTTP headers?
.............................

Once the connection is established, HTTP headers are available in
:attr:`~client.WebSocketClientProtocol.request_headers` and
:attr:`~client.WebSocketClientProtocol.response_headers`.

How do I set HTTP headers?
..........................

To set the ``Origin``, ``Sec-WebSocket-Extensions``, or
``Sec-WebSocket-Protocol`` headers in the WebSocket handshake request, use the
``origin``, ``extensions``, or ``subprotocols`` arguments of
:func:`~client.connect`.

To set other HTTP headers, for example the ``Authorization`` header, use the
``extra_headers`` argument::

    async with connect(..., extra_headers={"Authorization": ...}) as websocket:
        ...

How do I close a connection?
............................

The easiest is to use :func:`~client.connect` as a context manager::

    async with connect(...) as websocket:
        ...

The connection is closed when exiting the context manager.

How do I reconnect when the connection drops?
.............................................

Use :func:`~client.connect` as an asynchronous iterator::

    async for websocket in websockets.connect(...):
        try:
            ...
        except websockets.ConnectionClosed:
            continue

Make sure you handle exceptions in the ``async for`` loop. Uncaught exceptions
will break out of the loop.

How do I stop a client that is processing messages in a loop?
.............................................................

You can close the connection.

Here's an example that terminates cleanly when it receives SIGTERM on Unix:

.. literalinclude:: ../../example/shutdown_client.py
    :emphasize-lines: 10-13

How do I disable TLS/SSL certificate verification?
..................................................

Look at the ``ssl`` argument of :meth:`~asyncio.loop.create_connection`.

:func:`~client.connect` accepts the same arguments as
:meth:`~asyncio.loop.create_connection`.

asyncio usage
-------------

How do I run two coroutines in parallel?
........................................

You must start two tasks, which the event loop will run concurrently. You can
achieve this with :func:`asyncio.gather` or :func:`asyncio.create_task`.

Keep track of the tasks and make sure they terminate or you cancel them when
the connection terminates.

Why does my program never receive any messages?
...............................................

Your program runs a coroutine that never yields control to the event loop. The
coroutine that receives messages never gets a chance to run.

Putting an ``await`` statement in a ``for`` or a ``while`` loop isn't enough
to yield control. Awaiting a coroutine may yield control, but there's no
guarantee that it will.

For example, :meth:`~legacy.protocol.WebSocketCommonProtocol.send` only yields
control when send buffers are full, which never happens in most practical
cases.

If you run a loop that contains only synchronous operations and
a :meth:`~legacy.protocol.WebSocketCommonProtocol.send` call, you must yield
control explicitly with :func:`asyncio.sleep`::

    async def producer(websocket):
        message = generate_next_message()
        await websocket.send(message)
        await asyncio.sleep(0)  # yield control to the event loop

:func:`asyncio.sleep` always suspends the current task, allowing other tasks
to run. This behavior is documented precisely because it isn't expected from
every coroutine.

See `issue 867`_.

.. _issue 867: https://github.com/aaugustin/websockets/issues/867

Why does my simple program misbehave mysteriously?
..................................................

You are using :func:`time.sleep` instead of :func:`asyncio.sleep`, which
blocks the event loop and prevents asyncio from operating normally.

This may lead to messages getting send but not received, to connection
timeouts, and to unexpected results of shotgun debugging e.g. adding an
unnecessary call to :meth:`~legacy.protocol.WebSocketCommonProtocol.send`
makes the program functional.

Both sides
----------

What does ``ConnectionClosedError: no close frame received or sent`` mean?
..........................................................................

If you're seeing this traceback in the logs of a server:

.. code-block:: pytb

    connection handler failed
    Traceback (most recent call last):
      ...
    asyncio.exceptions.IncompleteReadError: 0 bytes read on a total of 2 expected bytes

    The above exception was the direct cause of the following exception:

    Traceback (most recent call last):
      ...
    websockets.exceptions.ConnectionClosedError: no close frame received or sent

or if a client crashes with this traceback:

.. code-block:: pytb

    Traceback (most recent call last):
      ...
    ConnectionResetError: [Errno 54] Connection reset by peer

    The above exception was the direct cause of the following exception:

    Traceback (most recent call last):
      ...
    websockets.exceptions.ConnectionClosedError: no close frame received or sent

it means that the TCP connection was lost. As a consequence, the WebSocket
connection was closed without receiving and sending a close frame, which is
abnormal.

You can catch and handle :exc:`~exceptions.ConnectionClosed` to prevent it
from being logged.

There are several reasons why long-lived connections may be lost:

* End-user devices tend to lose network connectivity often and unpredictably
  because they can move out of wireless network coverage, get unplugged from
  a wired network, enter airplane mode, be put to sleep, etc.
* HTTP load balancers or proxies that aren't configured for long-lived
  connections may terminate connections after a short amount of time, usually
  30 seconds, despite websockets' keepalive mechanism.

If you're facing a reproducible issue, :ref:`enable debug logs <debugging>` to
see when and how connections are closed.

What does ``ConnectionClosedError: sent 1011 (unexpected error) keepalive ping timeout; no close frame received`` mean?
.......................................................................................................................

If you're seeing this traceback in the logs of a server:

.. code-block:: pytb

    connection handler failed
    Traceback (most recent call last):
      ...
    asyncio.exceptions.CancelledError

    The above exception was the direct cause of the following exception:

    Traceback (most recent call last):
      ...
    websockets.exceptions.ConnectionClosedError: sent 1011 (unexpected error) keepalive ping timeout; no close frame received

or if a client crashes with this traceback:

.. code-block:: pytb

    Traceback (most recent call last):
      ...
    asyncio.exceptions.CancelledError

    The above exception was the direct cause of the following exception:

    Traceback (most recent call last):
      ...
    websockets.exceptions.ConnectionClosedError: sent 1011 (unexpected error) keepalive ping timeout; no close frame received

it means that the WebSocket connection suffered from excessive latency and was
closed after reaching the timeout of websockets' keepalive mechanism.

You can catch and handle :exc:`~exceptions.ConnectionClosed` to prevent it
from being logged.

There are two main reasons why latency may increase:

* Poor network connectivity.
* More traffic than the recipient can handle.

See the discussion of :doc:`timeouts <../topics/timeouts>` for details.

If websockets' default timeout of 20 seconds is too short for your use case,
you can adjust it with the ``ping_timeout`` argument.

How do I set a timeout on :meth:`~legacy.protocol.WebSocketCommonProtocol.recv`?
................................................................................

Use :func:`~asyncio.wait_for`::

    await asyncio.wait_for(websocket.recv(), timeout=10)

This technique works for most APIs, except for asynchronous context managers.
See `issue 574`_.

.. _issue 574: https://github.com/aaugustin/websockets/issues/574

How can I pass arguments to a custom protocol subclass?
.......................................................

You can bind additional arguments to the protocol factory with
:func:`functools.partial`::

    import asyncio
    import functools
    import websockets

    class MyServerProtocol(websockets.WebSocketServerProtocol):
        def __init__(self, extra_argument, *args, **kwargs):
            super().__init__(*args, **kwargs)
            # do something with extra_argument

    create_protocol = functools.partial(MyServerProtocol, extra_argument='spam')
    start_server = websockets.serve(..., create_protocol=create_protocol)

This example was for a server. The same pattern applies on a client.

How do I keep idle connections open?
....................................

websockets sends pings at 20 seconds intervals to keep the connection open.

It closes the connection if it doesn't get a pong within 20 seconds.

You can adjust this behavior with ``ping_interval`` and ``ping_timeout``.

See :doc:`../topics/timeouts` for details.

How do I respond to pings?
..........................

Don't bother; websockets takes care of responding to pings with pongs.

Miscellaneous
-------------

Can I use websockets without ``async`` and ``await``?
.....................................................

No, there is no convenient way to do this. You should use another library.

Are there ``onopen``, ``onmessage``, ``onerror``, and ``onclose`` callbacks?
............................................................................

No, there aren't.

websockets provides high-level, coroutine-based APIs. Compared to callbacks,
coroutines make it easier to manage control flow in concurrent code.

If you prefer callback-based APIs, you should use another library.

Why do I get the error: ``module 'websockets' has no attribute '...'``?
.......................................................................

Often, this is because you created a script called ``websockets.py`` in your
current working directory. Then ``import websockets`` imports this module
instead of the websockets library.

Why am I having problems with threads?
......................................

You shouldn't use threads. Use tasks instead.

If you have to, :meth:`~asyncio.loop.call_soon_threadsafe` may help.
