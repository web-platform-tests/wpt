# WebTransport tools in web-platform-test

This directory contains
[WebTransport](https://datatracker.ietf.org/wg/webtrans/documents/) related tools.

## WebTransport over HTTP/3
[webtransport_h3_server.py](./h3/webtransport_h3_server.py) implements a simple
[WebTransport over HTTP/3](https://datatracker.ietf.org/doc/draft-ietf-webtrans-http3/) server
for testing. It uses [aioquic](https://github.com/aiortc/aioquic/), and test
authors can implement WebTransport handlers by putting python scripts in
[wpt/webtransport/handlers/](../../webtransport/handlers/).

### Handlers

A WebTransport handler is a Python script which contains some callback functions. Callback functions are called every time a WebTransport event happens. [handler.py](./h3/handler.py) contains definitions of all callbacks.

The follwoing is an example handler which echos back received data.

```python
def stream_data_received(session, stream_id: int, data: bytes, stream_ended: bool):
    if session.stream_is_unidirectional(stream_id):
        return
    session.send_stream_data(stream_id, data)


def datagram_received(session, data: bytes):
    session.send_datagram(data)
```

`session` is a `WebTransportSession` object that represents a WebTransport over HTTP/3 session. It provides APIs to handle the session. See [webtransport_h3_server.py](./h3/webtransport_h3_server.py) for all `WebTransportSession` methods.