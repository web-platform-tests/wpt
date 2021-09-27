// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=resources/utils.js

'use strict';

compute_pressure_test(async t => {
  const update = await new Promise(async (resolve) => {
    const observer = new ComputePressureObserver(update => {
      resolve(update);
    });
    await observer.start();
  });
  assert_equals(typeof update.cpuUtilization, 'number');
  assert_equals(typeof update.cpuSpeed, 'number');
  assert_greater_than_equal(
      update.cpuUtilization, 0, 'CPU Utilization is greater or equal to zero');
  assert_greater_than_equal(
      update.cpuSpeed, 0, 'CPU Speed is greater or equal to zero');
}, 'ComputePressureObserver: Calls a callback with updates as data');

compute_pressure_test(async t => {
  const frame = document.body.appendChild(document.createElement('iframe'));
  t.add_cleanup(() => frame.remove());

  const obs = new frame.contentWindow.ComputePressureObserver(() => {});
  await promise_rejects_dom(
      t, 'SecurityError', frame.contentWindow.DOMException, obs.start());
}, 'ComputePressureObserver: Does not start on sub-frame request');
