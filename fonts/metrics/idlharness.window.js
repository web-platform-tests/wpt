// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

idl_test(
  ['font-metrics-api'],
  ['dom'],
  idl_array => {
    idl_array.add_objects({
      Document: ['document'],
    });
  }
);
