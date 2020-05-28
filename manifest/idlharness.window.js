// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js
// META: timeout=long

'use strict';

// https://w3c.github.io/manifest/

idl_test(
  ['manifest'],
  ['html'],
  idl_array => {
    idl_array.add_objects({
      manifest: ['document.createElement("link").relList.supports("manifest");']
    });
  }
);
