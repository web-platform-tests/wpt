About
=====

*wspy* is a standalone implementation of web sockets for Python, defined by
[RFC 6455](http://tools.ietf.org/html/rfc6455). The incentive for creating this
library is the absence of a layered implementation of web sockets outside the
scope of web servers such as Apache or Nginx. *wspy* does not require any
third-party programs or libraries outside Python's standard library. It
provides low-level access to sockets, as well as high-level functionalities to
easily set up a web server. Thus, it is both suited for quick server
programming, as well as for more demanding applications that require low-level
control over each frame being sent/received.

Here is a quick overview of the features in this library:
- Upgrading regular sockets to web sockets.
- Building custom frames (see "Sending frames with a websocket").
- Messages, which are higher-level than frames (see "Sending messages with a a
  connection").
- Connections, which hide the handling of control frames and automatically
  concatenate fragmented messages to individual payloads.
- HTTP authentication during handshake.
- Secure sockets using SSL certificates (for 'wss://...' URLs).
- An API for implementing WebSocket extensions. Included implementations are
  [deflate-frame](http://tools.ietf.org/html/draft-tyoshino-hybi-websocket-perframe-deflate-06)
  and
  [permessage-deflate](http://tools.ietf.org/html/draft-ietf-hybi-permessage-compression-17).
- Threaded and asynchronous (EPOLL-based) server implementations.


Installation
============

Using Python's package manager:

    sudo pip install wspy


Getting Started
===============

The following example is an echo server (sends back what it receives) and can
be used out of the box to connect with a browser. The API is similar to that of
web sockets in JavaScript:

    import logging
    import wspy

    class EchoServer(wspy.AsyncServer):
        def onopen(self, client):
            print 'Client %s connected' % client

        def onmessage(self, client, message):
            print 'Received message "%s"' % message.payload
            client.send(wspy.TextMessage(message.payload))

        def onclose(self, client, code, reason):
            print 'Client %s disconnected' % client

    EchoServer(('', 8000),
               extensions=[wspy.DeflateMessage(), wspy.DeflateFrame()],
               loglevel=logging.DEBUG).run()

Corresponding client code (JavaScript, run in browser):

    var ws = new WebSocket('ws://localhost:8000');
    ws.onopen = function() {
        console.log('open');
        this.send('Hello, World!');
    };
    ws.onmessage = function(e) {
        console.log('message', e.data);
    };
    ws.onerror = function() {
        console.log('error');
    };
    ws.onclose = function(e) {
        console.log('close', e.code, e.reason);
    };


Sending frames with a websocket
===============================

The `websocket` class upgrades a regular socket to a web socket. A
`websocket` instance is a single end point of a connection. A `websocket`
instance sends and receives frames (`Frame` instances) as opposed to bytes
(which are sent/received in a regular socket).

Server example:

    import wspy, socket
    sock = wspy.websocket()
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(('', 8000))
    sock.listen(5)

    client = sock.accept()
    client.send(wspy.Frame(wspy.OPCODE_TEXT, 'Hello, Client!'))
    frame = client.recv()

Client example:

    import wspy
    sock = wspy.websocket(location='/my/path')
    sock.connect(('', 8000))
    sock.send(wspy.Frame(wspy.OPCODE_TEXT, 'Hello, Server!', mask=True))


Sending messages with a connection
==================================

A `Connection` instance represents a connection between two end points, based
on a `websocket` instance. A connection handles control frames properly, and
sends/receives messages (`Message` instances, which are higher-level than
frames). Messages are automatically converted to frames, and received frames
are converted to messages. Fragmented messages (messages consisting of
multiple frames) are also supported.

Example of an echo server (sends back what it receives):

    import socket
    import wspy

    class EchoConnection(wspy.Connection):
        def onopen(self):
            print 'Connection opened at %s:%d' % self.sock.getpeername()

        def onmessage(self, message):
            print 'Received message "%s"' % message.payload
            self.send(wspy.TextMessage(message.payload))

        def onclose(self, code, reason):
            print 'Connection closed'

    server = wspy.websocket()
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('', 8000))
    server.listen(5)

    while True:
        client, addr = server.accept()
        EchoConnection(client).receive_forever()

There are two types of messages: `TextMessage`s and `BinaryMessage`s. A
`TextMessage` uses frames with opcode `OPCODE_TEXT`, and encodes its payload
using UTF-8 encoding. A `BinaryMessage` just sends its payload as raw data.
I recommend using `TextMessage` by default, and `BinaryMessage` only when
necessary.


Managing connections with a server
==================================

Threaded
--------

The `Server` class is very basic. It starts a new thread with a
`Connection.receive_forever()` loop for each client that connects. It also
handles client crashes properly. By default, a `Server` instance only logs
every event using Python's `logging` module. To create a custom server, The
`Server` class should be extended and its event handlers overwritten. The event
handlers are named identically to the `Connection` event handlers, but they
also receive an additional `client` argument. The client argument is a modified
`Connection` instance, so you can invoke `send()` and `recv()`.

For example, the `EchoConnection` example above can be rewritten to:

    import wspy

    class EchoServer(wspy.Server):
        def onopen(self, client):
            print 'Client %s connected' % client

        def onmessage(self, client, message):
            print 'Received message "%s"' % message.payload
            client.send(wspy.TextMessage(message.payload))

        def onclose(self, client, code, reason):
            print 'Client %s disconnected' % client

    EchoServer(('', 8000)).run()

The server can be stopped by typing CTRL-C in the command line. The
`KeyboardInterrupt` raised when this happens is caught by the server, making it
exit gracefully.

The full list of overwritable methods is: `onopen`, `onmessage`, `onclose`,
`onerror`, `onping`, `onpong`.

The server uses Python's built-in
[logging](https://docs.python.org/2/library/logging.html) module for logging.
Try passing the argument `loglevel=logging.DEBUG` to the server constructor if
you are having trouble debugging.

Asynchronous (recommended)
--------------------------

The `AsyncServer` class has the same API as `Server`, but uses
[EPOLL](https://docs.python.org/2/library/select.html#epoll-objects) instead of
threads. This means that when you send a message, it is put into a queue to be
sent later when the socket is ready. The client argument is again a modified
`Connection` instance, with a non-blocking `send()` method (`recv` is still
blocking, use the server's `onmessage` callback instead).

The asynchronous server has one additional method which you can implement:
`AsyncServer.onsent(self, client, message)`, which is called after a message
has completely been written to the socket. You will probably not need this
unless you are doing something advanced or have to clear a buffer in a
high-performance application.


Extensions
==========

TODO


Secure sockets with SSL
=======================

TODO
