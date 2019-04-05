# Pyppeteer

A Python library for controlling [the Google Chrome
browser](https://www.google.com/chrome/) using [the Chrome DevTools protocol
(CDP)](https://chromedevtools.github.io/devtools-protocol/).

## Concepts

- browser - web browser process which runs a WebSocket server that implements
  the Chrome DevTools Protocol; this process must be managed by the user of
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

The Chrome DevTools Protocol is under active development, and not all of its
current functionality is considered stable by the maintainers. The stability of
each feature is documented by that project, and this library avoids unstable
features whenever possible.

The stability of each CDP feature in use is annotated in the source code with
an in-line code comment--one of `# API status: stable`, `API status:
deprecated`, or `# API status: experimental`.

## Design

A prototype implementation was created in the fall of 2018. [Notes on that
experiment are available
online.](https://bocoup.github.io/presentation-wpt-on-cdp/) The library has
since been improved to use a more efficient WebSocket transport mechanism and
to more closely match the semantics of commands in [the WebDriver
specification](https://w3c.github.io/webdriver/).
