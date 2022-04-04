Changelog
---------

.. currentmodule:: websockets

.. _backwards-compatibility policy:

Backwards-compatibility policy
..............................

``websockets`` is intended for production use. Therefore, stability is a goal.

``websockets`` also aims at providing the best API for WebSocket in Python.

While we value stability, we value progress more. When an improvement requires
changing a public API, we make the change and document it in this changelog.

When possible with reasonable effort, we preserve backwards-compatibility for
five years after the release that introduced the change.

When a release contains backwards-incompatible API changes, the major version
is increased, else the minor version is increased. Patch versions are only for
fixing regressions shortly after a release.

Only documented APIs are public. Undocumented APIs are considered private.
They may change at any time.

9.1
...

*May 27, 2021*

.. note::

    **Version 9.1 fixes a security issue introduced in version 8.0.**

    Version 8.0 was vulnerable to timing attacks on HTTP Basic Auth passwords.

9.0.2
.....

*May 15, 2021*

* Restored compatibility of ``python -m websockets`` with Python < 3.9.

* Restored compatibility with mypy.

9.0.1
.....

*May 2, 2021*

* Fixed issues with the packaging of the 9.0 release.

9.0
...

*May 1, 2021*

.. note::

    **Version 9.0 moves or deprecates several APIs.**

    Aliases provide backwards compatibility for all previously public APIs.

    * :class:`~datastructures.Headers` and
      :exc:`~datastructures.MultipleValuesError` were moved from
      ``websockets.http`` to :mod:`websockets.datastructures`. If you're using
      them, you should adjust the import path.

    * The ``client``, ``server``, ``protocol``, and ``auth`` modules were
      moved from the ``websockets`` package to ``websockets.legacy``
      sub-package, as part of an upcoming refactoring. Despite the name,
      they're still fully supported. The refactoring should be a transparent
      upgrade for most uses when it's available. The legacy implementation
      will be preserved according to the `backwards-compatibility policy`_.

    * The ``framing``, ``handshake``, ``headers``, ``http``, and ``uri``
      modules in the ``websockets`` package are deprecated. These modules
      provided low-level APIs for reuse by other WebSocket implementations,
      but that never happened. Keeping these APIs public makes it more
      difficult to improve websockets for no actual benefit.

.. note::

    **Version 9.0 may require changes if you use static code analysis tools.**

    Convenience imports from the ``websockets`` module are performed lazily.
    While this is supported by Python, static code analysis tools such as mypy
    are unable to understand the behavior.

    If you depend on such tools, use the real import path, which can be found
    in the API documentation::

        from websockets.client import connect
        from websockets.server import serve

* Added compatibility with Python 3.9.

* Added support for IRIs in addition to URIs.

* Added close codes 1012, 1013, and 1014.

* Raised an error when passing a :class:`dict` to
  :meth:`~legacy.protocol.WebSocketCommonProtocol.send`.

* Fixed sending fragmented, compressed messages.

* Fixed ``Host`` header sent when connecting to an IPv6 address.

* Fixed creating a client or a server with an existing Unix socket.

* Aligned maximum cookie size with popular web browsers.

* Ensured cancellation always propagates, even on Python versions where
  :exc:`~asyncio.CancelledError` inherits :exc:`Exception`.

* Improved error reporting.


8.1
...

*November 1, 2019*

* Added compatibility with Python 3.8.

8.0.2
.....

*July 31, 2019*

* Restored the ability to pass a socket with the ``sock`` parameter of
  :func:`~legacy.server.serve`.

* Removed an incorrect assertion when a connection drops.

8.0.1
.....

*July 21, 2019*

* Restored the ability to import ``WebSocketProtocolError`` from
  ``websockets``.

8.0
...

*July 7, 2019*

.. warning::

    **Version 8.0 drops compatibility with Python 3.4 and 3.5.**

.. note::

    **Version 8.0 expects** ``process_request`` **to be a coroutine.**

    Previously, it could be a function or a coroutine.

    If you're passing a ``process_request`` argument to
    :func:`~legacy.server.serve`
    or :class:`~legacy.server.WebSocketServerProtocol`, or if you're overriding
    :meth:`~legacy.server.WebSocketServerProtocol.process_request` in a subclass,
    define it with ``async def`` instead of ``def``.

    For backwards compatibility, functions are still mostly supported, but
    mixing functions and coroutines won't work in some inheritance scenarios.

.. note::

    **Version 8.0 changes the behavior of the** ``max_queue`` **parameter.**

    If you were setting ``max_queue=0`` to make the queue of incoming messages
    unbounded, change it to ``max_queue=None``.

.. note::

    **Version 8.0 deprecates the** ``host`` **,** ``port`` **, and** ``secure``
    **attributes of** :class:`~legacy.protocol.WebSocketCommonProtocol`.

    Use :attr:`~legacy.protocol.WebSocketCommonProtocol.local_address` in
    servers and
    :attr:`~legacy.protocol.WebSocketCommonProtocol.remote_address` in clients
    instead of ``host`` and ``port``.

.. note::

    **Version 8.0 renames the** ``WebSocketProtocolError`` **exception**
    to :exc:`~exceptions.ProtocolError` **.**

    A ``WebSocketProtocolError`` alias provides backwards compatibility.

.. note::

    **Version 8.0 adds the reason phrase to the return type of the low-level
    API** ``read_response()`` **.**

Also:

* :meth:`~legacy.protocol.WebSocketCommonProtocol.send`,
  :meth:`~legacy.protocol.WebSocketCommonProtocol.ping`, and
  :meth:`~legacy.protocol.WebSocketCommonProtocol.pong` support bytes-like
  types :class:`bytearray` and :class:`memoryview` in addition to
  :class:`bytes`.

* Added :exc:`~exceptions.ConnectionClosedOK` and
  :exc:`~exceptions.ConnectionClosedError` subclasses of
  :exc:`~exceptions.ConnectionClosed` to tell apart normal connection
  termination from errors.

* Added :func:`~legacy.auth.basic_auth_protocol_factory` to enforce HTTP
  Basic Auth on the server side.

* :func:`~legacy.client.connect` handles redirects from the server during the
  handshake.

* :func:`~legacy.client.connect` supports overriding ``host`` and ``port``.

* Added :func:`~legacy.client.unix_connect` for connecting to Unix sockets.

* Improved support for sending fragmented messages by accepting asynchronous
  iterators in :meth:`~legacy.protocol.WebSocketCommonProtocol.send`.

* Prevented spurious log messages about :exc:`~exceptions.ConnectionClosed`
  exceptions in keepalive ping task. If you were using ``ping_timeout=None``
  as a workaround, you can remove it.

* Changed :meth:`WebSocketServer.close()
  <legacy.server.WebSocketServer.close>` to perform a proper closing handshake
  instead of failing the connection.

* Avoided a crash when a ``extra_headers`` callable returns ``None``.

* Improved error messages when HTTP parsing fails.

* Enabled readline in the interactive client.

* Added type hints (:pep:`484`).

* Added a FAQ to the documentation.

* Added documentation for extensions.

* Documented how to optimize memory usage.

* Improved API documentation.

7.0
...

*November 1, 2018*

.. warning::

    ``websockets`` **now sends Ping frames at regular intervals and closes the
    connection if it doesn't receive a matching Pong frame.**

    See :class:`~legacy.protocol.WebSocketCommonProtocol` for details.

.. warning::

    **Version 7.0 changes how a server terminates connections when it's closed
    with** :meth:`WebSocketServer.close()
    <legacy.server.WebSocketServer.close>` **.**

    Previously, connections handlers were canceled. Now, connections are
    closed with close code 1001 (going away). From the perspective of the
    connection handler, this is the same as if the remote endpoint was
    disconnecting. This removes the need to prepare for
    :exc:`~asyncio.CancelledError` in connection handlers.

    You can restore the previous behavior by adding the following line at the
    beginning of connection handlers::

        def handler(websocket, path):
            closed = asyncio.ensure_future(websocket.wait_closed())
            closed.add_done_callback(lambda task: task.cancel())

.. note::

    **Version 7.0 renames the** ``timeout`` **argument of**
    :func:`~legacy.server.serve` **and** :func:`~legacy.client.connect` **to**
    ``close_timeout`` **.**

    This prevents confusion with ``ping_timeout``.

    For backwards compatibility, ``timeout`` is still supported.

.. note::

    **Version 7.0 changes how a**
    :meth:`~legacy.protocol.WebSocketCommonProtocol.ping` **that hasn't
    received a pong yet behaves when the connection is closed.**

    The ping — as in ``ping = await websocket.ping()`` — used to be canceled
    when the connection is closed, so that ``await ping`` raised
    :exc:`~asyncio.CancelledError`. Now ``await ping`` raises
    :exc:`~exceptions.ConnectionClosed` like other public APIs.

.. note::

    **Version 7.0 raises a** :exc:`RuntimeError` **exception if two coroutines
    call** :meth:`~legacy.protocol.WebSocketCommonProtocol.recv`
    **concurrently.**

    Concurrent calls lead to non-deterministic behavior because there are no
    guarantees about which coroutine will receive which message.

Also:

* Added ``process_request`` and ``select_subprotocol`` arguments to
  :func:`~legacy.server.serve` and
  :class:`~legacy.server.WebSocketServerProtocol` to customize
  :meth:`~legacy.server.WebSocketServerProtocol.process_request` and
  :meth:`~legacy.server.WebSocketServerProtocol.select_subprotocol` without
  subclassing :class:`~legacy.server.WebSocketServerProtocol`.

* Added support for sending fragmented messages.

* Added the :meth:`~legacy.protocol.WebSocketCommonProtocol.wait_closed`
  method to protocols.

* Added an interactive client: ``python -m websockets <uri>``.

* Changed the ``origins`` argument to represent the lack of an origin with
  ``None`` rather than ``''``.

* Fixed a data loss bug in
  :meth:`~legacy.protocol.WebSocketCommonProtocol.recv`:
  canceling it at the wrong time could result in messages being dropped.

* Improved handling of multiple HTTP headers with the same name.

* Improved error messages when a required HTTP header is missing.

6.0
...

*July 16, 2018*

.. warning::

    **Version 6.0 introduces the** :class:`~datastructures.Headers` **class
    for managing HTTP headers and changes several public APIs:**

    * :meth:`~legacy.server.WebSocketServerProtocol.process_request` now
      receives a :class:`~datastructures.Headers` instead of a
      ``http.client.HTTPMessage`` in the ``request_headers`` argument.

    * The ``request_headers`` and ``response_headers`` attributes of
      :class:`~legacy.protocol.WebSocketCommonProtocol` are
      :class:`~datastructures.Headers` instead of ``http.client.HTTPMessage``.

    * The ``raw_request_headers`` and ``raw_response_headers`` attributes of
      :class:`~legacy.protocol.WebSocketCommonProtocol` are removed. Use
      :meth:`~datastructures.Headers.raw_items` instead.

    * Functions defined in the ``handshake`` module now receive
      :class:`~datastructures.Headers` in argument instead of ``get_header``
      or ``set_header`` functions. This affects libraries that rely on
      low-level APIs.

    * Functions defined in the ``http`` module now return HTTP headers as
      :class:`~datastructures.Headers` instead of lists of ``(name, value)``
      pairs.

    Since :class:`~datastructures.Headers` and ``http.client.HTTPMessage``
    provide similar APIs, this change won't affect most of the code dealing
    with HTTP headers.


Also:

* Added compatibility with Python 3.7.

5.0.1
.....

*May 24, 2018*

* Fixed a regression in 5.0 that broke some invocations of
  :func:`~legacy.server.serve` and :func:`~legacy.client.connect`.

5.0
...

*May 22, 2018*

.. note::

    **Version 5.0 fixes a security issue introduced in version 4.0.**

    Version 4.0 was vulnerable to denial of service by memory exhaustion
    because it didn't enforce ``max_size`` when decompressing compressed
    messages (`CVE-2018-1000518`_).

    .. _CVE-2018-1000518: https://nvd.nist.gov/vuln/detail/CVE-2018-1000518

.. note::

    **Version 5.0 adds a** ``user_info`` **field to the return value of**
    :func:`~uri.parse_uri` **and** :class:`~uri.WebSocketURI` **.**

    If you're unpacking :class:`~uri.WebSocketURI` into four variables, adjust
    your code to account for that fifth field.

Also:

* :func:`~legacy.client.connect` performs HTTP Basic Auth when the URI contains
  credentials.

* Iterating on incoming messages no longer raises an exception when the
  connection terminates with close code 1001 (going away).

* A plain HTTP request now receives a 426 Upgrade Required response and
  doesn't log a stack trace.

* :func:`~legacy.server.unix_serve` can be used as an asynchronous context
  manager on Python ≥ 3.5.1.

* Added the :attr:`~legacy.protocol.WebSocketCommonProtocol.closed` property
  to protocols.

* If a :meth:`~legacy.protocol.WebSocketCommonProtocol.ping` doesn't receive a
  pong, it's canceled when the connection is closed.

* Reported the cause of :exc:`~exceptions.ConnectionClosed` exceptions.

* Added new examples in the documentation.

* Updated documentation with new features from Python 3.6.

* Improved several other sections of the documentation.

* Fixed missing close code, which caused :exc:`TypeError` on connection close.

* Fixed a race condition in the closing handshake that raised
  :exc:`~exceptions.InvalidState`.

* Stopped logging stack traces when the TCP connection dies prematurely.

* Prevented writing to a closing TCP connection during unclean shutdowns.

* Made connection termination more robust to network congestion.

* Prevented processing of incoming frames after failing the connection.

4.0.1
.....

*November 2, 2017*

* Fixed issues with the packaging of the 4.0 release.

4.0
...

*November 2, 2017*

.. warning::

    **Version 4.0 drops compatibility with Python 3.3.**

.. note::

    **Version 4.0 enables compression with the permessage-deflate extension.**

    In August 2017, Firefox and Chrome support it, but not Safari and IE.

    Compression should improve performance but it increases RAM and CPU use.

    If you want to disable compression, add ``compression=None`` when calling
    :func:`~legacy.server.serve` or :func:`~legacy.client.connect`.

.. note::

    **Version 4.0 removes the** ``state_name`` **attribute of protocols.**

    Use ``protocol.state.name`` instead of ``protocol.state_name``.

Also:

* :class:`~legacy.protocol.WebSocketCommonProtocol` instances can be used as
  asynchronous iterators on Python ≥ 3.6. They yield incoming messages.

* Added :func:`~legacy.server.unix_serve` for listening on Unix sockets.

* Added the :attr:`~legacy.server.WebSocketServer.sockets` attribute to the
  return value of :func:`~legacy.server.serve`.

* Reorganized and extended documentation.

* Aborted connections if they don't close within the configured ``timeout``.

* Rewrote connection termination to increase robustness in edge cases.

* Stopped leaking pending tasks when :meth:`~asyncio.Task.cancel` is called on
  a connection while it's being closed.

* Reduced verbosity of "Failing the WebSocket connection" logs.

* Allowed ``extra_headers`` to override ``Server`` and ``User-Agent`` headers.

3.4
...

*August 20, 2017*

* Renamed :func:`~legacy.server.serve` and :func:`~legacy.client.connect`'s
  ``klass`` argument to ``create_protocol`` to reflect that it can also be a
  callable. For backwards compatibility, ``klass`` is still supported.

* :func:`~legacy.server.serve` can be used as an asynchronous context manager
  on Python ≥ 3.5.1.

* Added support for customizing handling of incoming connections with
  :meth:`~legacy.server.WebSocketServerProtocol.process_request`.

* Made read and write buffer sizes configurable.

* Rewrote HTTP handling for simplicity and performance.

* Added an optional C extension to speed up low-level operations.

* An invalid response status code during :func:`~legacy.client.connect` now
  raises :class:`~exceptions.InvalidStatusCode` with a ``code`` attribute.

* Providing a ``sock`` argument to :func:`~legacy.client.connect` no longer
  crashes.

3.3
...

*March 29, 2017*

* Ensured compatibility with Python 3.6.

* Reduced noise in logs caused by connection resets.

* Avoided crashing on concurrent writes on slow connections.

3.2
...

*August 17, 2016*

* Added ``timeout``, ``max_size``, and ``max_queue`` arguments to
  :func:`~legacy.client.connect` and :func:`~legacy.server.serve`.

* Made server shutdown more robust.

3.1
...

*April 21, 2016*

* Avoided a warning when closing a connection before the opening handshake.

* Added flow control for incoming data.

3.0
...

*December 25, 2015*

.. warning::

    **Version 3.0 introduces a backwards-incompatible change in the**
    :meth:`~legacy.protocol.WebSocketCommonProtocol.recv` **API.**

    **If you're upgrading from 2.x or earlier, please read this carefully.**

    :meth:`~legacy.protocol.WebSocketCommonProtocol.recv` used to return
    ``None`` when the connection was closed. This required checking the return
    value of every call::

        message = await websocket.recv()
        if message is None:
            return

    Now it raises a :exc:`~exceptions.ConnectionClosed` exception instead.
    This is more Pythonic. The previous code can be simplified to::

        message = await websocket.recv()

    When implementing a server, which is the more popular use case, there's no
    strong reason to handle such exceptions. Let them bubble up, terminate the
    handler coroutine, and the server will simply ignore them.

    In order to avoid stranding projects built upon an earlier version, the
    previous behavior can be restored by passing ``legacy_recv=True`` to
    :func:`~legacy.server.serve`, :func:`~legacy.client.connect`,
    :class:`~legacy.server.WebSocketServerProtocol`, or
    :class:`~legacy.client.WebSocketClientProtocol`. ``legacy_recv`` isn't
    documented in their signatures but isn't scheduled for deprecation either.

Also:

* :func:`~legacy.client.connect` can be used as an asynchronous context
  manager on Python ≥ 3.5.1.

* Updated documentation with ``await`` and ``async`` syntax from Python 3.5.

* :meth:`~legacy.protocol.WebSocketCommonProtocol.ping` and
  :meth:`~legacy.protocol.WebSocketCommonProtocol.pong` support data passed as
  :class:`str` in addition to :class:`bytes`.

* Worked around an :mod:`asyncio` bug affecting connection termination under
  load.

* Made ``state_name`` attribute on protocols a public API.

* Improved documentation.

2.7
...

*November 18, 2015*

* Added compatibility with Python 3.5.

* Refreshed documentation.

2.6
...

*August 18, 2015*

* Added ``local_address`` and ``remote_address`` attributes on protocols.

* Closed open connections with code 1001 when a server shuts down.

* Avoided TCP fragmentation of small frames.

2.5
...

*July 28, 2015*

* Improved documentation.

* Provided access to handshake request and response HTTP headers.

* Allowed customizing handshake request and response HTTP headers.

* Added support for running on a non-default event loop.

* Returned a 403 status code instead of 400 when the request Origin isn't
  allowed.

* Canceling :meth:`~legacy.protocol.WebSocketCommonProtocol.recv` no longer
  drops the next message.

* Clarified that the closing handshake can be initiated by the client.

* Set the close code and reason more consistently.

* Strengthened connection termination by simplifying the implementation.

* Improved tests, added tox configuration, and enforced 100% branch coverage.

2.4
...

*January 31, 2015*

* Added support for subprotocols.

* Added ``loop`` argument to :func:`~legacy.client.connect` and
  :func:`~legacy.server.serve`.

2.3
...

*November 3, 2014*

* Improved compliance of close codes.

2.2
...

*July 28, 2014*

* Added support for limiting message size.

2.1
...

*April 26, 2014*

* Added ``host``, ``port`` and ``secure`` attributes on protocols.

* Added support for providing and checking Origin_.

.. _Origin: https://tools.ietf.org/html/rfc6455#section-10.2

2.0
...

*February 16, 2014*

.. warning::

    **Version 2.0 introduces a backwards-incompatible change in the**
    :meth:`~legacy.protocol.WebSocketCommonProtocol.send`,
    :meth:`~legacy.protocol.WebSocketCommonProtocol.ping`, and
    :meth:`~legacy.protocol.WebSocketCommonProtocol.pong` **APIs.**

    **If you're upgrading from 1.x or earlier, please read this carefully.**

    These APIs used to be functions. Now they're coroutines.

    Instead of::

        websocket.send(message)

    you must now write::

        await websocket.send(message)

Also:

* Added flow control for outgoing data.

1.0
...

*November 14, 2013*

* Initial public release.
