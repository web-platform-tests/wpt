// META: variant=?excludeIDLMember=PerformanceEventTiming\.targetSelector
// META: variant=?includeIDLMember=PerformanceEventTiming\.targetSelector
// META: global=window
// META: script=/common/subset-tests-by-key.js
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

// https://wicg.github.io/event-timing/

'use strict';

idl_test(
  ['event-timing'],
  ['performance-timeline', 'hr-time', 'dom'],
  idl_array => {
    idl_array.add_objects({
      Performance: ['performance'],
      EventCounts: ['performance.eventCounts'],
      // PerformanceEventTiming: [ TODO ]
    });
  }
);
