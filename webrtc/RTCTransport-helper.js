'use strict';

/*
  Code using this helper should also include RTCPeerConnection-helper.js
  in the main HTML file

  The following helper functions are called from RTCPeerConnection-helper.js:
    getTrackFromUserMedia
    exchangeIceCandidates
    doSignalingHandshake
*/

// Wait for all DTLS and ICE transport of a peer connection
// to turn to connected or completed state. When the RTCPeerConnectionState
// is "connected", all RTCIceTransports and RTCDtlsTransports are in the
// "connected", "completed" or "closed" state and at least one of them is in the
// "connected" or "completed" state.
async function waitForConnectedState(pc) {
  if (pc.connectionState === 'connected') {
    return;
  }

  return new Promise((resolve, reject) => {
    pc.addEventListener('connectionstatechange', () => {
      const { connectionState } = pc;

      if (connectionState === 'connected') {
        resolve();
      } else if (['closed', 'failed'].includes(connectionState)) {
        reject(new Error(`one of DTLS/ICE transports transition to unexpected state ${connectionState}`));
      }
    });
  });
}
