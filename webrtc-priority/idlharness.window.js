// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

idl_test(
  ['webrtc-priority'],
  ['webrtc', 'dom'],
  idl_array => {
    idl_array.add_objects({
      RTCDataChannel: ['dataChannel']
    });
    const pc = new RTCPeerConnection();
    self.dataChannel = pc.createDataChannel('label');
  }
);
