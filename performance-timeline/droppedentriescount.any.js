// META: script=performanceobservers.js

promise_test(t => {
  return new Promise(resolve => {
    new PerformanceObserver(t.step_func((entries, obs, options) => {
      assert_equals(options['droppedEntriesCount'], 0);
      resolve();
    })).observe({type: 'mark'});
    performance.mark('test');
  })
}, 'Dropped entries count is 0 when there are no dropped entries.');

promise_test(t => {
  // Set a buffer size of 0 so that new entries count as dropped.
  performance.setResourceTimingBufferSize(0);
  return new Promise(resolve => {
    let entries_seen = 0;
    new PerformanceObserver(t.step_func((entries, obs, options) => {
      entries_seen++;
      assert_equals(options['droppedEntriesCount'], entries_seen,
          'droppedEntriesCount should equal the number of entries seen');
      fetch('resources/square.png?id=2');
      if (entries_seen == 2)
        resolve();
    })).observe({type: 'resource'});
    fetch('resources/square.png?id=1');
  });
}, 'Dropped entries count is nonzero when there are dropped entries.');

promise_test(t => {
  // Set a buffer size of 0 so that new entries count as dropped.
  performance.setResourceTimingBufferSize(0);
  return new Promise(resolve => {
    new PerformanceObserver(t.step_func((entries, obs, options) => {
      assert_equals(options['droppedEntriesCount'], 0);
      resolve();
    })).observe({type: 'mark'});
    fetch('resources/square.png?id=3').then(() => {
      performance.mark('meow');
    });
  });
}, 'Dropped entries count is zero when dropped entries are not of relevant type.');

promise_test(t => {
  return new Promise(resolve => {
      new PerformanceObserver(t.step_func((entries, obs, options) => {
        assert_greater_than(options['droppedEntriesCount'], 0,
            'There should have been some dropped resource timing entries at this point');
        resolve();
      })).observe({type: 'resource', buffered: true});
  });
}, 'Dropped entries counted even if observer was not registered at the time.');
