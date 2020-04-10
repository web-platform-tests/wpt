// META: global=window,worker
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js
// META: quic=true

'use strict';

idl_test(
  ['webtransport'],
  [],
  idl_array => {
    idl_array.add_objects({
      WebTransport: ['webTransport'],
      // TODO: The stream APIs below require a working connection to create.
      // BidirectionalStream
      // SendStream
      // ReceiveStream
    });
    webTransport = new WebTransport("quic-transport://example.com/");
  }
);
