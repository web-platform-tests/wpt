#!/usr/bin/env python3

import asyncio
import argparse
import logging
import os
from typing import Any

_dir = os.path.dirname(__file__)
_certs_dir = os.path.join(_dir, "..", "certs")


def get_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="WebTransport over HTTP/3 server")
    parser.add_argument(
        "-c",
        "--cert-path",
        type=str,
        default=os.path.join(_certs_dir, "web-platform.test.pem"),
        help="load the TLS certificate from the specified file",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="::",
        help="listen on the specified address (defaults to ::)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=4433,
        help="listen on the specified port (defaults to 4433)",
    )
    parser.add_argument(
        "-k",
        "--key-path",
        type=str,
        default=os.path.join(_certs_dir, "web-platform.test.key"),
        help="load the TLS private key from the specified file",
    )
    parser.add_argument(
        "--doc-root",
        type=str,
        default=os.path.join(_dir, "..", ".."),
        help="the root directory path of the server",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        help=
        "specify log level: DEBUG, INFO, WARNING, ERROR, CRITICAL (defaults to INFO)"
    )
    return parser


# This method is supposed to be called from `wpt serve-webtransport-h3`.
def run(venv: Any, **kwargs: Any) -> None:
    loglevel = getattr(logging, kwargs["log_level"], logging.INFO)
    logging.basicConfig(
        format="[%(asctime)s %(processName)s] %(levelname)s - %(message)s",
        level=loglevel,
    )

    from .h3.webtransport_h3_server import WebTransportH3Server
    server = WebTransportH3Server(host=kwargs["host"],
                                  port=kwargs["port"],
                                  doc_root=kwargs["doc_root"],
                                  cert_path=kwargs["cert_path"],
                                  key_path=kwargs["key_path"],
                                  logger=logging.getLogger("webtransport-h3"))
    server.start()

    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        server.stop()


def main() -> None:
    kwargs = vars(get_parser().parse_args())
    run(None, **kwargs)


if __name__ == "__main__":
    main()
