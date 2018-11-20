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

function getDtlsTransportFromSctpTransport(sctpTransport) {
  assert_true(sctpTransport instanceof RTCSctpTransport,
    'Expect pc.sctp to be instantiated from RTCSctpTransport');

  const dtlsTransport = sctpTransport.transport;
  assert_true(dtlsTransport instanceof RTCDtlsTransport,
    'Expect sctp.transport to be an RTCDtlsTransport');

  return dtlsTransport;
}

function getIceTransportFromSctpTransport(sctpTransport) {
  const dtlsTransport = getDtlsTransportFromSctpTransport(sctpTransport);

  const { iceTransport } = dtlsTransport;
  assert_true(iceTransport instanceof RTCIceTransport,
    'Expect dtlsTransport.iceTransport to be an RTCIceTransport');

  return iceTransport;
}

// Get one or more RTCDtlsTransports from RTCRtpSender/Receiver
// in pc.There may be more than one DTLSTransport if there are
// multiple underlying transports, such as when not using max-bundle,
// or when not using RTCP multiplexing.
function getDtlsTransportsFromSenderReceiver(pc) {
  const senders = pc.getSenders();
  const receivers = pc.getReceivers();

  const dtlsTransportsSet = new Set();

  function addDtlsTransport(transport) {
    // Add a dtls transport to the result set, if it is
    // not null/undefined. Although the spec mandates both
    // transport and rtcpTransport fields must be set together,
    // we validate that requirement in separate test cases.
    if (transport) {
      assert_true(transport instanceof RTCDtlsTransport,
        'Expect transport to be an RTCDtlsTransport');

      dtlsTransportsSet.add(transport);
    }
  }

  for (const sender of senders) {
    addDtlsTransport(sender.transport);
    addDtlsTransport(sender.rtcpTransport);
  }

  for (const receiver of receivers) {
    addDtlsTransport(receiver.transport);
    addDtlsTransport(receiver.rtcpTransport);
  }

  const dtlsTransports = [...dtlsTransportsSet];

  if (dtlsTransports.length === 0) {
    assert_unreached('Expect to get at least one unique RTCDtlsTransport from senders and receivers');
  }

  return dtlsTransports;
}

function getIceTransportFromDtlsTransport(dtlsTransport) {
  const { iceTransport } = dtlsTransport;

  assert_true(iceTransport instanceof RTCIceTransport,
    'Expect dtlsTransport.iceTransport to be an RTCIceTransport');

  return iceTransport;
}

function getIceTransportsFromDtlsTransports(dtlsTransports) {
  const iceTransports = new Set();

  for (const dtlsTransport of dtlsTransports) {
    iceTransports.add(getIceTransportFromDtlsTransport(dtlsTransport));
  }

  return [...iceTransports];
}

function getIceTransportsFromSenderReceiver(pc) {
  const dtlsTransports = getDtlsTransportsFromSenderReceiver(pc);

  const iceTransports = new Set(
    dtlsTransports.map(getIceTransportFromDtlsTransport));

  return [...iceTransports];
}
