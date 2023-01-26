# WebRTC in web-platform-tests

This document describes [RTCWeb](https://datatracker.ietf.org/wg/rtcweb/documents/) support in web-platform-tests.

## RTP reflector
`tools/webrtc` provides a simple [aiortc](https://github.com/aiortc/aiortc)-based echo server that
acts as a WebRTC endpoint. It answers to STUN binding requests sent by the browser in order to
establish the ICE connection, then compeltes the DTLS handshake and derives the SRTP session keys.

This allows the server to decrypt received RTP/RTCP packets and send them back to the caller via
the WebSocket used to establish the connection and exchange the signaling parameters.

The caller can then parse those packets and interpret the packets. This provides a low-level access
to the wire-level data that is not possible to achieve directly with WebRTC.
