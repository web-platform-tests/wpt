// META: global=window,worker
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

// https://w3c.github.io/longtask-timing/

'use strict';

promise_test(async t => {
  const srcs = ['longtasks', 'performance-timeline'];
  const [idl, perf] = await Promise.all(
    srcs.map(i => fetch(`/interfaces/${i}.idl`).then(r => r.text())));

  const idl_array = new IdlArray();
  idl_array.add_idls(idl);
  idl_array.add_dependency_idls(perf);

  const testIdls = new Promise(resolve => {
    const observer = new PerformanceObserver(entryList => {
      const entries = Array.from(entryList.getEntries());
      const attribution = entries
          .reduce((sum, e) => sum.concat(e.attribution || []), []);
      idl_array.add_objects({
        PerformanceLongTaskTiming: entries,
        TaskAttributionTiming: attribution,
      });
      idl_array.test();
      resolve();
    });
    observer.observe({entryTypes: ['longtask']});
  });

  const taskTime = 100;
  const longTask = () => {
    var begin = self.performance.now();
    while (self.performance.now() < begin + taskTime);
  }
  t.step_timeout(longTask, 0);

  const timeout = new Promise(
      (_, reject) => t.step_timeout(reject, 2 * taskTime));
  return Promise.race([testIdls, timeout])
    .then(
        t.step_func_done(),
        t.unreached_func('LongTask was not observed'));
}, 'longtasks interfaces');
