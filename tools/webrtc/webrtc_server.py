# import functools
# import os
import logging
from typing import Any, Dict, List, Optional, Tuple

from mod_pywebsocket import standalone as pywebsocket
import threading

"""
A WebRTC server for testing.

The server interprets the underlying protocols (WebRTC) and passes packets
received back to the browser via the websocket.
"""

SERVER_NAME = 'webrtc-server'

_logger: logging.Logger = logging.getLogger(__name__)
_doc_root: str = ""

class WebRTCServer:
    """
    A WebRTC echo server for testing.

    :param host: Host from which to serve.
    :param port: Port from which to serve.
    :param doc_root: Document root for serving handlers.
    :param cert_path: Path to certificate file to use.
    :param key_path: Path to key file to use.
    :param logger: a Logger object for this server.
    """
    def __init__(self, host: str, port: int, doc_root: str, handlers_root, cert_path: str,
                 key_path: str, bind_address: str, logger: logging.Logger) -> None:
        logger = logging.getLogger()
        self.host = host
        port = 4404
        cmd_args = ["-p", str(port), # why???
                    "-d", doc_root,
                    "-w", handlers_root]

        if key_path is not None and cert_path is not None:
            cmd_args += ["--tls",
                         "--private-key", key_path,
                         "--certificate", cert_path]

        if (bind_address):
            cmd_args = ["-H", host] + cmd_args
        opts, args = pywebsocket._parse_args_and_config(cmd_args)
        opts.cgi_directories = []
        opts.is_executable_method = None
        self.server = pywebsocket.WebSocketServer(opts)
        ports = [item[0].getsockname()[1] for item in self.server._sockets]
        if not ports:
            # TODO: Fix the logging configuration in WebSockets processes
            # see https://github.com/web-platform-tests/wpt/issues/22719
            logger.critical("Failed to start webrtc server on port %s, "
                            "is something already using that port?" % port, file=sys.stderr)
            raise OSError()
        assert all(item == ports[0] for item in ports)
        self.port = ports[0]
        self.started = False
        self.server_thread = None

    def start(self):
        logger = logging.getLogger()
        logger.info("Starting WebRTC server %s", self.port)
        self.started = True
        self.server_thread = threading.Thread(target=self.server.serve_forever)
        self.server_thread.setDaemon(True)  # don't hang on exit
        self.server_thread.start()

    def stop(self):
        """
        Stops the server.

        If the server is not running, this method has no effect.
        """
        logger = logging.getLogger()
        logger.info("Stopping WebRTC server %s", self.port)
        if self.started:
            try:
                self.server.shutdown()
                self.server.server_close()
                self.server_thread.join()
                self.server_thread = None
            except AttributeError:
                pass
            self.started = False
        self.server = None

