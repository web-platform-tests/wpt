'use strict';

/*
  Code using this helper should also include RTCPeerConnection-helper.js
  in the main HTML file

  The following helper functions are called from RTCPeerConnection-helper.js:
    getTrackFromUserMedia
    addTrackOrTransceiver
    exchangeIceCandidates
    doSignalingHandshake
*/

// Wait for all DTLS and ICE transport of a peer connection
// to turn to connected or completed state. When the RTCPeerConnectionState
// is "connected", all RTCIceTransports and RTCDtlsTransports are in the
// "connected", "completed" or "closed" state and at least one of them is in the
// "connected" or "completed" state.
function waitConnectingPc(pc) {
  return new Promise((resolve, reject) => {
    if (pc.connectionState === 'connected') {
      resolve();
    }

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

  const iceTransport = dtlsTransport.transport;
  assert_true(iceTransport instanceof RTCIceTransport,
    'Expect dtlsTransport.transport to be an RTCIceTransport');

  return iceTransport;
}

// Get one or more RTCDtlsTransports from RTCRtpSender/Receiver
// in pc. There may be more than one e.g. there are more than one
// senders/receivers or when there are different underlying
// transports for RTP and RTCP.
function getDtlsTransportsFromSenderReceiver(pc) {
  const senders = pc.getSenders();
  const receivers = pc.getReceivers();

  const dtlsTransportsSet = new Set();

  function adddDtlsTransport(transport) {
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
    adddDtlsTransport(sender.transport);
    adddDtlsTransport(sender.rtcpTransport);
  }

  for (const receiver of receivers) {
    adddDtlsTransport(receiver.transport);
    adddDtlsTransport(receiver.rtcpTransport);
  }

  const dtlsTransports = [...dtlsTransportsSet];

  if (dtlsTransports.length === 0) {
    assert_unreached('Expect to get at least one unique RTCDtlsTransport from sender receivers');
  }

  return dtlsTransports;
}

function getIceTransportFromDtlsTransport(dtlsTransport) {
  const iceTransport = dtlsTransport.transport;

  assert_true(iceTransport instanceof RTCIceTransport,
    'Expect dtlsTransport.transport to be an RTCIceTransport');

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

// Create DTLS transports by creating data channels
// and connecting two peer connections. Returns an
// array of two RTCDtlsTransports, which obtained
// from RTCSctpTransport in pc.sctp.
function createDtlsTransportsFromSctp(pc1, pc2) {
  pc1.createDataChannel('');
  exchangeIceCandidates(pc1, pc2);

  return doSignalingHandshake(pc1, pc2)
  .then(() => {
    const dtlsTransport1 = getDtlsTransportFromSctpTransport(pc1.sctp);
    const dtlsTransport2 = getDtlsTransportFromSctpTransport(pc2.sctp);

    return [dtlsTransport1, dtlsTransport2];
  });
}

// Create DTLS transports by adding tracks and connecting
// two peer connections. Returns an array of two array of
// RTCDtlsTransports. This is because each peer connection
// may have multiple underlying DTLS transports for each
// RTP/RTCP sender/receivers.
function createDtlsTransportsFromSenderReceiver(pc1, pc2) {
  return getTrackFromUserMedia('audio')
  .then(([track, mediaStream]) => {
    addTrackOrTransceiver(pc1, track, mediaStream);
    exchangeIceCandidates(pc1, pc2);

    return doSignalingHandshake(pc1, pc2)
    .then(() => {
      const dtlsTransports1 = getDtlsTransportsFromSenderReceiver(pc1);
      const dtlsTransports2 = getDtlsTransportsFromSenderReceiver(pc2);

      return [dtlsTransports1, dtlsTransports2];
    });
  });
}

function createIceTransportsFromSctp(pc1, pc2) {
  return createDtlsTransportsFromSctp(pc1, pc2)
  .then(([dtlsTransport1, dtlsTransport2]) => {
    const iceTransport1 = getIceTransportFromDtlsTransport(dtlsTransport1);
    const iceTransport2 = getIceTransportFromDtlsTransport(dtlsTransport2);

    return [iceTransport1, iceTransport2];
  });
}

function createIceTransportsFromSenderReceiver(pc1, pc2) {
  return createDtlsTransportsFromSenderReceiver(pc1, pc2)
  .then(([dtlsTransports1, dtlsTransports2]) => {
    const iceTransports1 = getIceTransportsFromDtlsTransports(dtlsTransports1);
    const iceTransports2 = getIceTransportsFromDtlsTransports(dtlsTransports2);

    return [iceTransports1, iceTransports2];
  });
}
