import logging
#from typing import Any, Dict, List, Optional, Tuple

import asyncio

from aiortc import (
    RTCCertificate,
    RTCDtlsFingerprint,
    RTCDtlsParameters,
    RTCDtlsTransport,
    RTCIceGatherer,
    RTCIceParameters,
    RTCIceTransport,
)
from aiortc.sdp import candidate_from_sdp, candidate_to_sdp

import websockets
import ssl
import json
import functools

"""
A WebRTC server for testing.

The server interprets the underlying protocols (WebRTC) and passes packets
received back to the browser via the websocket.
"""

loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

async def webrtc(websocket, path):
    gatherer = RTCIceGatherer(iceServers=[])
    iceTransport = RTCIceTransport(gatherer)
    certificate = RTCCertificate.generateCertificate()
    dtlsTransport = RTCDtlsTransport(iceTransport, [certificate])
    async def handle_rtp_data(websocket, data: bytes, arrival_time_ms: int) -> None:
        await websocket.send(data)

    async def handle_rtcp_data(websocket, data: bytes) -> None:
        await websocket.send(data)

    # monkey-patch RTCDtlsTransport
    dtlsTransport._handle_rtp_data = functools.partial(
        handle_rtp_data, websocket
    )
    dtlsTransport._handle_rtcp_data = functools.partial(
        handle_rtcp_data, websocket
    )

    await gatherer.gather()

    iceParameters = iceTransport.iceGatherer.getLocalParameters()
    dtlsParameters = dtlsTransport.getLocalParameters()

    async for raw_message in websocket:
        try:
            message = json.loads(raw_message)
            # TODO: some more error handling?
            iceParameters = iceTransport.iceGatherer.getLocalParameters()
            dtlsParameters = dtlsTransport.getLocalParameters()
            await websocket.send(json.dumps(
                {
                    "ice": {
                        "usernameFragment": iceParameters.usernameFragment,
                        "password": iceParameters.password,
                    },
                    "dtls": {
                        "role": "auto",
                        "fingerprints": list(
                            map(
                                lambda fp: {
                                    "algorithm": fp.algorithm,
                                    "value": fp.value,
                                },
                                dtlsParameters.fingerprints,
                            )
                        ),
                    },
                    "candidates": list(
                        map(
                            lambda c: "candidate:" + candidate_to_sdp(c),
                            iceTransport.iceGatherer.getLocalCandidates(),
                        )
                    ),
                }
            ))
            # process the offer now
            coros = map(
                iceTransport.addRemoteCandidate,
                map(candidate_from_sdp, message["candidates"]),
            )
            await asyncio.gather(*coros)

            remoteIceParameters = RTCIceParameters(
                usernameFragment=message["ice"]["usernameFragment"],
                password=message["ice"]["password"],
            )
            remoteDtlsParameters = RTCDtlsParameters(
                fingerprints=list(
                    map(
                        lambda fp: RTCDtlsFingerprint(
                            algorithm=fp["algorithm"], value=fp["value"]
                        ),
                        message["dtls"]["fingerprints"],
                    )
                )
            )

            await iceTransport.iceGatherer.gather()

            iceTransport._connection.ice_controlling = False

            await iceTransport.start(remoteIceParameters)
            await dtlsTransport.start(remoteDtlsParameters)

        except Exception as error:
            print(error)
            websocket.close()

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
    def __init__(self, host: str, port: int, cert_path: str,
                 key_path: str, logger: logging.Logger) -> None:
        logger = logging.getLogger()
        self.host = host
        self.port = 4404 # TODO = port

        self.ssl_context = None
        if key_path is not None and cert_path is not None:
            self.ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            self.ssl_context.load_cert_chain(certfile=cert_path, keyfile=key_path)

        self.started = False

    def start(self):
        logger = logging.getLogger()
        logger.info("Starting WebRTC server %s", self.port)

        self.started = True
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.run())
        # TODO: this is not right, it needs to run until stop() is called
        loop.run_forever()

    async def run(self):
        self.server = await websockets.serve(webrtc, self.host, self.port, ssl=self.ssl_context)

    def stop(self):
        """
        Stops the server.

        If the server is not running, this method has no effect.
        """
        logger = logging.getLogger()
        logger.info("Stopping WebRTC server %s", self.port)
        if self.started:
            try:
                self.server.stop()
            except AttributeError:
                pass
            self.started = False

