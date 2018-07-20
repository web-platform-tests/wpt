// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://w3c.github.io/selection-api/

idl_test(
  ['selection-api'],
  ['dom', 'html'],
  idlArray => {
    // "Cast" window as GlobalEventHandlers
    try {
      window.global =
        Object.assign(Object.create(GlobalEventHandlers), window);
    } catch (e) {
      // Will be surfaced in idlharness.js's test_object below.
    }

    idlArray.add_objects({
      Window: ['window'],
      Document: ['document'],
      Selection: ['getSelection()'],
      GlobalEventHandlers: ['self'],
    });
  },
  'selection-api interfaces'
);
