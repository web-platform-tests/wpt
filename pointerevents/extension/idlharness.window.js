// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://w3c.github.io/pointerevents/

idl_test(
  ['pointerevents-extension'],
  ['pointerevents', 'uievents', 'dom', 'html'],
  idl_array => {
    idl_array.add_objects({
      PointerEvent: ['new PointerEvent("type")']
    });
  },
  'pointerevents-extension interfaces'
);
