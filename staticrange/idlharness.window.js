// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

// https://w3c.github.io/staticrange/

'use strict';

idl_test(
  ['staticrange'],
  ['dom'],
  idl_array => {
    idl_array.add_objects({
      StaticRange: ['staticRange'],
    });

    self.staticRange = new StaticRange({
      start: document.body,
      end: document.body
    });
  }
);
