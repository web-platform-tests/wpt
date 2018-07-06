// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://w3c.github.io/mediacapture-screen-share/

idl_test(
  ['screen-capture'],
  ['mediacapture-main'],
  idl_array => {
    idl_array.add_objects({
      NavigatorUserMedia: ['navigator'],
    });
  },
  'screen-capture interfaces.');
