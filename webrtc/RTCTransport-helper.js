'use strict';

// Wait for a connecting dtlsTransport to transist
// into connected state.
function waitConnectingDtlsTransport(dtlsTransport) {
  return new Promise((resolve, reject) => {
    if (dtlsTransport.state === 'connected') {
      resolve(dtlsTransport);
    } else {
      dtlsTransport.addEventListener('statechange', () => {
        const { state } = dtlsTransport;

        if (state === 'connected') {
          resolve(dtlsTransport);
        } else if (['closed', 'failed'].includes(state)) {
          reject(new Error(`dtlsTransport transition to unexpected state ${state}`));
        }
      });

      dtlsTransport.addEventListener('error', reject);
    }
  });
}

function waitConnectingIceTransport(iceTransport) {
  return new Promise((resolve, reject) => {
    if (['connected', 'completed'].includes(iceTransport.state)) {
      resolve(iceTransport);
    } else {
      iceTransport.addEventListener('statechange', () => {
        const { state } = iceTransport;

        if(['connected', 'completed'].includes(iceTransport.state)) {
          resolve(iceTransport);
        } else if (['closed', 'failed', 'disconnected'].includes(state)) {
          reject(new Error(`dtlsTransport transition to unexpected state ${state}`));
        }
      });
    }
  });
}

// Get a RTCDtlsTransport from pc.sctp
function getDtlsTransportFromSctp(pc) {
  const sctpTransport = pc.sctp;
  assert_true(sctpTransport instanceof RTCSctpTransport,
    'Expect pc.sctp to be instantiated from RTCSctpTransport');

  const dtlsTransport = sctpTransport.transport;
  assert_true(dtlsTransport instanceof RTCDtlsTransport,
    'Expect sctp.transport to be an RTCDtlsTransport');

  return dtlsTransport;
}

function getIceTransportFromSctp(pc) {
  const dtlsTransport = getDtlsTransportFromSctp(pc);

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

  assert_greater_than(senders.length, 0,
    'Expect pc to have at least one sender');

  assert_greater_than(receivers.length, 0,
    'Expect pc to have at least one receiver');

  const dtlsTransports = new Set();

  for (const sender of senders) {
    dtlsTransports.add(sender.transport);
    dtlsTransports.add(sender.rtcpTransport);
  }

  for (const receiver of receivers) {
    dtlsTransports.add(receiver.transport);
    dtlsTransports.add(receiver.rtcpTransport);
  }

  for (const dtlsTransport of dtlsTransports) {
    assert_true(dtlsTransport instanceof RTCDtlsTransport,
      'Expect sctp.transport to be an RTCDtlsTransport');
  }

  return [...dtlsTransports];
}

function getIceTransportFromDtlsTransport(dtlsTransport) {
  const iceTransport = dtlsTransport.transport;

  assert_true(iceTransport instanceof RTCIceTransport,
    'Expect dtlsTransport.transport to be an RTCIceTransport');

  return iceTransport;
}

function getIceTransportsFromSenderReceiver(pc) {
  const dtlsTransports = getDtlsTransportsFromSenderReceiver(pc);

  const iceTransports = new Set(
    dtlsTransports.map(getIceTransportFromDtlsTransport));

  return [...iceTransports];
}

function createDtlsTransportsFromSctp(pc1, pc2) {
  pc1.createDataChannel('test');
  exchangeIceCandidates(pc1, pc2);

  return doSignalingHandshake(pc1, pc2)
  .then(() => {
    const dtlsTransport1 = getDtlsTransportFromSctp(pc1);
    const dtlsTransport2 = getDtlsTransportFromSctp(pc2);

    return [dtlsTransport1, dtlsTransport2];
  });
}

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
