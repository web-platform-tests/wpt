# WebTransport in web-platform-test

This document describes [WebTransport](https://datatracker.ietf.org/wg/webtrans/documents/) support in web-platform-test.

## WebTransport over HTTP/3
`tools/webtransport` provides a simple
[WebTransport over HTTP/3](https://datatracker.ietf.org/doc/draft-ietf-webtrans-http3/) server for testing. The server interprets the underlying protocols (WebTransport, HTTP/3 and QUIC) and manages webtransport sessions. When the server receives a request (extended CONNECT method) from a client the server looks up a corresponding webtransport handler based on the `:path` header value, then delegates actual tasks to the handler. Handlers are typically located under `webtransport/handlers`.

### Handlers

A WebTransport handler is a python script which contains callback functions. Callback functions are called every time a WebTransport event happens. Definitions of all callback can be found the [APIs section](#APIs).

The follwoing is an example handler which echos back received data.

```python
def stream_data_received(session, stream_id: int, data: bytes, stream_ended: bool):
    if session.stream_is_unidirectional(stream_id):
        return
    session.send_stream_data(stream_id, data)


def datagram_received(session, data: bytes):
    session.send_datagram(data)
```

`session` is a `WebTransportSession` object that represents a WebTransport over HTTP/3 session. It provides APIs to handle the session.

### APIs

```eval_rst
.. toctree::
   :maxdepth: 1

   docs/handler
```