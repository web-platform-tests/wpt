test(t => {
  performance.clearResourceTimings();
  // First observer creates second in callback to ensure the entry has been dispatched by the time
  // the second observer begins observing.
  assert_throws_js(() => new PerformanceObserver(() => {}).observe({entryTypes: ['mark'], buffered: true}), TypeError);
  fetch('resources/empty.js');
}, 'PerformanceObserver with buffered flag and entryTypes should throw');
