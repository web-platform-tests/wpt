# Chrome Debugger Protocol client for Python

This is a work in progress. Please avert your eyes.

## Concepts

- browser - web browser process which runs a WebSocket server that implements
  the Chrome Debugger Protocol; this process is managed by the user of
  Pyppeteer
- `pyppeteer.Connection` - abstraction around a WebSocket connection to a
  running browser process
- `pyppeteer.Session` - interface for interacting with a browser window

                    .---------------- Pyppeteer ---------------.
    .---------.     |     .------------.           .---------. |
    | browser | 1 <---> * | Connection | * <---> 1 | Session | |
    '---------'     |     '------------'           '---------' |
                    '------------------------------------------'

## Stability

The Chrome Debugger Protocol is under active development, and not all of its
current functionality is considered stable by the maintainers. The stability of
each feature is clearly documented by that project, and this module avoids
unstable features whenever possible.

The stability of all features are annotated in the source code with an in-line
code comment--one of `# API status: stable` or `# API status: experimental`.

## WebSocket Clients in Python

Python lacks a standard library implementation of a WebSocket client. This
project uses an open source Python WebSocket client in order to limit
responsibilities. The following WebSocket client libraries were considered:

- Chrome Debugger Protocol-specific
  - [chromewhip](https://github.com/chuckus/chromewhip)
  - [PyChromeDevTools](https://github.com/marty90/PyChromeDevTools)
  - [pychrome](https://github.com/fate0/pychrome)
- Generic WebSocket clients
  - [Lomond](https://pypi.org/project/lomond/)
  - [pywebsocket](https://github.com/google/pywebsocket) - "pywebsocket is
    intended for testing or experimental purposes."
  - [wspy](https://github.com/taddeus/wspy) - client too primitive to interface
    with Chrome
  - [WebSock](https://pypi.org/project/websock/) - does not expose a client
    abstraction
  - [gevent-websocket](https://pypi.org/project/gevent-websocket/) - Last
    released: Mar 12, 2017
  - [ws4py](https://github.com/Lawouach/WebSocket-for-Python) - unmaintained
  - [Autobahn](https://crossbar.io/autobahn/#python) &
    [Twisted](http://twistedmatrix.com/) (Autobahn also integrates with
    [asyncio](http://docs.python.org/3.4/library/asyncio.html))
  - [websockets](https://pypi.org/project/websockets/) - requires Python 3
  - [websocket-client](https://pypi.org/project/websocket-client/) - LGPL licensed
  - [Tornado](http://www.tornadoweb.org/)

The WPT project imposes a number of constraints which limit the options:

- Operating systems: GNU/Linux, macOS, and Windows
- Platform: Python 2
- License: [BSD
  3-clause](https://github.com/web-platform-tests/wpt/blob/5acd3bcf6609691afc493aed8cb4446e8dc796ee/LICENSE.md)
  compatible
- functional integration with the WebSocket protocol supported by
  Chromium/Chrome (e.g. version and protocol extensions)

Four libraries satisfy those constraints:

- [Lomond](https://pypi.org/project/lomond/)
- [gevent-websocket](https://pypi.org/project/gevent-websocket/)
- [ws4py](https://github.com/Lawouach/WebSocket-for-Python)
- [Autobahn](https://crossbar.io/autobahn/#python) &
  [Twisted](http://twistedmatrix.com/)

The following subjectively priorities were applied to select among the
remaining alternatives:

- probability of support/maintenance
- number and size of dependencies

These criteria informed the selection of the Lomond Python WebSocket client
library.

[The authors of the Lomond library offered some commentary on their
motivation](http://www.tornadoweb.org/):

> The two libraries that were suitable for our product, websocket-client and
> ws4py, both had show-stopper bugs with ssl support; websocket-client would
> sometimes refuse to processes packets until additional data was received, and
> ws4py could lose entire packets. I'm sure both libraries could be fixed, but
> neither project appears to be actively maintained.
