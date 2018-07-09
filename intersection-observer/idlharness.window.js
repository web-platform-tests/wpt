// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://w3c.github.io/IntersectionObserver/

idl_test(
  ['intersection-observer'],
  ['dom'],
  idl_array => {
    let observer;
    try {
      var options = {
        root: document.body,
        rootMargin: '0px',
        threshold: 1.0
      }
      observer = new IntersectionObserver(() => {}, options);
    } catch (e) {
      // Will be surfaced by idlharness.js's test_object below.
    }
    idl_array.add_objects({
      IntersectionObserver: [observer],
    });
  },
  'intersection-observer interfaces.');
