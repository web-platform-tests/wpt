// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

idl_test(
  ['reporting'],
  [],
  idl_array => {
    idl_array.add_objects({
      ReportBody: [],
      Report: [],
      ReportingObserver: ['new ReportingObserver((reports, observer) => {})'],
    });
  }
);
