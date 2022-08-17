#!/usr/bin/python

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
import json
import uuid
import functools

state = {}
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

async def handle(id, message, websocket):
    # TODO: parameter checking
    gatherer = RTCIceGatherer(iceServers=[])
    iceTransport = RTCIceTransport(gatherer)
    certificate = RTCCertificate.generateCertificate()
    dtlsTransport = RTCDtlsTransport(iceTransport, [certificate])
    async def handle_rtp_data(websocket, data: bytes, arrival_time_ms: int) -> None:
        websocket.send_message(data, binary=True)

    async def handle_rtcp_data(websocket, data: bytes) -> None:
        websocket.send_message(data, binary=True)

    # monkey-patch RTCDtlsTransport
    dtlsTransport._handle_rtp_data = functools.partial(
        handle_rtp_data, websocket
    )
    dtlsTransport._handle_rtcp_data = functools.partial(
        handle_rtcp_data, websocket
    )
    state[id] = (gatherer, iceTransport, dtlsTransport)

    coros = map(
        iceTransport.addRemoteCandidate,
        map(candidate_from_sdp, message["candidates"]),
    )
    await asyncio.gather(*coros)
    await gatherer.gather()

    iceParameters = iceTransport.iceGatherer.getLocalParameters()
    dtlsParameters = dtlsTransport.getLocalParameters()

    websocket.send_message(json.dumps(
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

def web_socket_do_extra_handshake(request):
    pass

def web_socket_transfer_data(request):
    id = uuid.uuid4()
    # TODO: can we tag the request with id for cleanup?
    asyncio.set_event_loop(loop)

    raw_message = request.ws_stream.receive_message()
    try:
        message = json.loads(raw_message)
        loop.run_until_complete(handle(id, message, request.ws_stream))
        loop.run_forever()

    except Exception as error:
        print(error)
        request.ws_stream.close_connection()
    finally:
        state.pop(id)

def web_socket_passive_closing_handshake(request):
    print("WS disconnected")
    pass




# class Endpoint(WebSocketEndpoint):
#     encoding = "json"

#     async def on_connect(self, websocket):
#         gatherer (iceServers=[])
#         websocket.state.iceTransport = RTCIceTransport(gatherer)
#         certificate = RTCCertificate.generateCertificate()
#         websocket.state.dtlsTransport = RTCDtlsTransport(
#             websocket.state.iceTransport, [certificate]
#         )

#         # monkey-patch RTCDtlsTransport
#         websocket.state.dtlsTransport._handle_rtp_data = functools.partial(
#             handle_rtp_data, websocket
#         )
#         websocket.state.dtlsTransport._handle_rtcp_data = functools.partial(
#             handle_rtcp_data, websocket
#         )

#         await websocket.accept()

#     async def on_receive(self, websocket, message):
#         if self.encoding == "json":
#             iceTransport = websocket.state.iceTransport
#             iceParameters = iceTransport.iceGatherer.getLocalParameters()
#             dtlsTransport = websocket.state.dtlsTransport
#             dtlsParameters = dtlsTransport.getLocalParameters()

#             coros = map(
#                 iceTransport.addRemoteCandidate,
#                 map(candidate_from_sdp, message["candidates"]),
#             )
#             await asyncio.gather(*coros)

#             await websocket.send_json(
#                 {
#                     "ice": {
#                         "usernameFragment": iceParameters.usernameFragment,
#                         "password": iceParameters.password,
#                     },
#                     "dtls": {
#                         "role": "auto",
#                         "fingerprints": list(
#                             map(
#                                 lambda fp: {
#                                     "algorithm": fp.algorithm,
#                                     "value": fp.value,
#                                 },
#                                 dtlsParameters.fingerprints,
#                             )
#                         ),
#                     },
#                     "candidates": list(
#                         map(
#                             lambda c: "candidate:" + candidate_to_sdp(c),
#                             iceTransport.iceGatherer.getLocalCandidates(),
#                         )
#                     ),
#                 }
#             )

#             remoteIceParameters = RTCIceParameters(
#                 usernameFragment=message["ice"]["usernameFragment"],
#                 password=message["ice"]["password"],
#             )
#             remoteDtlsParameters = RTCDtlsParameters(
#                 fingerprints=list(
#                     map(
#                         lambda fp: RTCDtlsFingerprint(
#                             algorithm=fp["algorithm"], value=fp["value"]
#                         ),
#                         message["dtls"]["fingerprints"],
#                     )
#                 )
#             )

#             await iceTransport.iceGatherer.gather()

#             iceTransport._connection.ice_controlling = False

#             await iceTransport.start(remoteIceParameters)
#             await dtlsTransport.start(remoteDtlsParameters)
#             self.encoding = "bytes"
#         elif self.encoding == "bytes":
#             await websocket.state.dtlsTransport._send_rtp(message)
#         else:
#             print("Unhandled encoding", self.encoding)

#     async def on_disconnect(self, websocket, close_code):
#         await websocket.state.dtlsTransport.stop()
#         await websocket.state.iceTransport.stop()
