// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://w3c.github.io/html-media-capture/

idl_test(
  ['html-media-capture'],
  ['html', 'dom'],
  idl_array => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'user';
    idl_array.add_objects({
      HTMLInputElement: [input],
    });
  },
  'html-media-capture interfaces.');
