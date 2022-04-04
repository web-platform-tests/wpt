API reference
=============

.. currentmodule:: websockets

websockets provides client and server implementations, as shown in
the :doc:`getting started guide <../intro/index>`.

The process for opening and closing a WebSocket connection depends on which
side you're implementing.

* On the client side, connecting to a server with :func:`~client.connect`
  yields a connection object that provides methods for interacting with the
  connection. Your code can open a connection, then send or receive messages.

  If you use :func:`~client.connect` as an asynchronous context manager,
  then websockets closes the connection on exit. If not, then your code is
  responsible for closing the connection.

* On the server side, :func:`~server.serve` starts listening for client
  connections and yields an server object that you can use to shut down
  the server.

  Then, when a client connects, the server initializes a connection object and
  passes it to a handler coroutine, which is where your code can send or
  receive messages. This pattern is called `inversion of control`_. It's
  common in frameworks implementing servers.

  When the handler coroutine terminates, websockets closes the connection. You
  may also close it in the handler coroutine if you'd like.

.. _inversion of control: https://en.wikipedia.org/wiki/Inversion_of_control

Once the connection is open, the WebSocket protocol is symmetrical, except for
low-level details that websockets manages under the hood. The same methods
are available on client connections created with :func:`~client.connect` and
on server connections received in argument by the connection handler
of :func:`~server.serve`.

Since websockets provides the same API — and uses the same code — for client
and server connections, common methods are documented in a "Both sides" page.

.. toctree::
   :titlesonly:

   client
   server
   common
   utilities
   exceptions
   types
   extensions
   limitations

Public API documented in the API reference are subject to the
:ref:`backwards-compatibility policy <backwards-compatibility policy>`.

Anything that isn't listed in the API reference is a private API. There's no
guarantees of behavior or backwards-compatibility for private APIs.

For convenience, many public APIs can be imported from the ``websockets``
package. However, this feature is incompatible with static code analysis. It
breaks autocompletion in an IDE or type checking with mypy_. If you're using
such tools, use the real import paths.

.. _mypy: https://github.com/python/mypy
