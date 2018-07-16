// META: global=window,worker
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

// https://w3c.github.io/performance-timeline/

'use strict';

promise_test(async t => {
  const observe = new Promise((resolve, reject) => {
    try {
      const callback = (e, o) => { };
      self.observer = new PerformanceObserver((entries, observer) => {
        self.entryList = entries;
        resolve();
      });
      observer.observe({ entryTypes: ['mark'] });
      performance.mark('test');
    } catch (e) {
      reject(e);
    }
  });
  const timeout = new Promise((_, reject) => {
    t.step_timeout(() => reject('Timed out waiting for observation'), 3000);
  });
  const execute_test = () => {
    idl_test(
      ['performance-timeline'],
      ['hr-time', 'dom'],
      idl_array => {
        idl_array.add_objects({
          Performance: ['performance'],
          PerformanceObserver: ['observer'],
          // NOTE: PerformanceEntry is implicitly tested in user-timing.
          PerformanceObserverEntryList: ['entryList'],
          PerformanceObserverEntry: ['entryList[0]'],
        });
      },
      'Test IDL implementation of performance-timeline API'
    );
  };

  return Promise.race([observe, timeout]).then(
    execute_test,
    reason => {
      execute_test();
      return Promise.reject(reason);
    }
  );
})
