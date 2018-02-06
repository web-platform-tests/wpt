'use strict'

function getIceTransportFromDtls(dtlsTransport) {
  assert_true(dtlsTransport instanceof RTCDtlsTransport,
    'Expect sctp.transport to be an RTCDtlsTransport');

  const iceTransport = dtlsTransport.transport;
  assert_true(iceTransport instanceof RTCIceTransport,
    'Expect dtlsTransport.transport to be an RTCIceTransport');

  return iceTransport;
}

function getIceTransportFromSctp(pc) {
  const sctpTransport = pc.sctp;
  assert_true(sctpTransport instanceof RTCSctpTransport,
    'Expect pc.sctp to be instantiated from RTCSctpTransport');

  return getIceTransportFromDtls(sctpTransport.transport)
}

function getIceTransportsFromSenderReceiver(pc) {
  const senders = pc.getSenders()
  const receivers = pc.getReceivers()

  assert_greater_than(senders.length, 0,
    'Expect pc to have at least one sender')

  assert_greater_than(receivers.length, 0,
    'Expect pc to have at least one receiver')

  const [sender] = senders;
  const [receiver] = receivers;

  const iceTransports = new Set();

  iceTransports.add(getIceTransportFromDtls(sender.transport));
  iceTransports.add(getIceTransportFromDtls(sender.rtcpTransport));
  iceTransports.add(getIceTransportFromDtls(receiver.transport));
  iceTransports.add(getIceTransportFromDtls(receiver.rtcpTransport));

  return [...iceTransports];
}

function validateCandidates(candidates) {
  assert_greater_than(candidates.length, 0,
    'Expect at least one ICE candidate returned from get*Candidates()');

  for(const candidate of candidates) {
   assert_true(candidate instanceof RTCIceCandidate,
     'Expect candidate elements to be instance of RTCIceCandidate');
  }
}

function validateCandidateParameter(param) {
 assert_not_equals(param, null,
   'Expect candidate parameter to be non-null after data channels are connected');

 assert_equals(typeof param.usernameFragment, 'string',
   'Expect param.usernameFragment to be set with string value');

 assert_equals(typeof param.password, 'string',
   'Expect param.password to be set with string value');
}

function validateConnectedIceTransport(iceTransport) {
  const { state, gatheringState, role, component } = iceTransport;

  assert_true(role === 'controlling' || role === 'controlled',
    'Expect RTCIceRole to be either controlling or controlled');

  assert_true(component === 'rtp' || component === 'rtcp',
    'Expect RTCIceComponent to be either rtp or rtcp');

  assert_true(state === 'connected' || state === 'completed',
    'Expect ICE transport to be in connected or completed state after data channels are connected');

  assert_true(gatheringState === 'gathering' || gatheringState === 'completed',
    'Expect ICE transport to be in gathering or completed gatheringState after data channels are connected');

  validateCandidates(iceTransport.getLocalCandidates());
  validateCandidates(iceTransport.getRemoteCandidates());

  const candidatePair = iceTransport.getSelectedCandidatePair();
  assert_not_equals(candidatePair, null,
    'Expect selected candidate pair to be non-null after ICE transport is connected');

  assert_true(candidatePair.local instanceof RTCIceCandidate,
    'Expect candidatePair.local to be instance of RTCIceCandidate');

  assert_true(candidatePair.remote instanceof RTCIceCandidate,
    'Expect candidatePair.remote to be instance of RTCIceCandidate');

  validateCandidateParameter(iceTransport.getLocalParameters());
  validateCandidateParameter(iceTransport.getRemoteParameters());
}
