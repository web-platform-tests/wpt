// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://w3c.github.io/paint-timing/

idl_test(
  ['paint-timing'],
  ['performance-timeline'],
  (idl_array, t) => {
    idl_array.add_objects({
      PerformancePaintTiming: ['paintTiming'],
    });

    const awaitPaint = resolve => {
      try {
        const entries = performance.getEntriesByType('paint');
        if (entries || entries.length) {
          window.paintTiming = entries[0];
          resolve();
          return;
        }
        t.step_timeout(awaitPaint, 50);
      } catch (e) {
        // Will be surfaced in idlharness.js's test_object.
      }
    }
    const timeout = new Promise((_, reject) => {
      t.step_timeout(() => reject('Timed out waiting for paint event'), 3000);
    });
    return Promise.race([new Promise(awaitPaint), timeout]);
  },
  'paint-timing interfaces.');
