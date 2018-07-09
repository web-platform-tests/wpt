// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://w3c.github.io/hr-time/

function cast(i, t) {
  return Object.assign(i, Object.create(t));
}

idl_test(
  ['hr-time'],
  ['html', 'dom'],
  idl_array => {
    idl_array.add_objects({
      Performance: ['performance'],
    });
  },
  'hr-time interfaces.');
