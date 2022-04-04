API
===

``websockets`` provides complete client and server implementations, as shown
in the :doc:`getting started guide <../intro>`.

The process for opening and closing a WebSocket connection depends on which
side you're implementing.

* On the client side, connecting to a server with :class:`~websockets.connect`
  yields a connection object that provides methods for interacting with the
  connection. Your code can open a connection, then send or receive messages.

  If you use :class:`~websockets.connect` as an asynchronous context manager,
  then websockets closes the connection on exit. If not, then your code is
  responsible for closing the connection.

* On the server side, :class:`~websockets.serve` starts listening for client
  connections and yields an server object that supports closing the server.

  Then, when clients connects, the server initializes a connection object and
  passes it to a handler coroutine, which is where your code can send or
  receive messages. This pattern is called `inversion of control`_. It's
  common in frameworks implementing servers.

  When the handler coroutine terminates, websockets closes the connection. You
  may also close it in the handler coroutine if you'd like.

.. _inversion of control: https://en.wikipedia.org/wiki/Inversion_of_control

Once the connection is open, the WebSocket protocol is symmetrical, except for
low-level details that websockets manages under the hood. The same methods are
available on client connections created with :class:`~websockets.connect` and
on server connections passed to the connection handler in the arguments.

At this point, websockets provides the same API — and uses the same code — for
client and server connections. For convenience, common methods are documented
both in the client API and server API.

.. toctree::
   :maxdepth: 2

   client
   server
   extensions
   utilities

All public APIs can be imported from the :mod:`websockets` package, unless
noted otherwise. This convenience feature is incompatible with static code
analysis tools such as mypy_, though.

.. _mypy: https://github.com/python/mypy

Anything that isn't listed in this API documentation is a private API. There's
no guarantees of behavior or backwards-compatibility for private APIs.
