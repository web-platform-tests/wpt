// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js

'use strict';

promise_test(async t => {
  await test_driver.set_permission({name: 'compute-pressure'}, 'granted');

  const update = await new Promise(resolve => {
    const observer = new PressureObserver(resolve, {sampleRate: 1.0});
    t.add_cleanup(() => observer.disconnect());
    const promise1 = observer.observe('cpu');
    const promise2 = observer.observe('cpu');
    const promise3 = observer.observe('cpu');
    // Calling observe multiple times should return the same Promise.
    assert_equals(promise1, promise2);
    assert_equals(promise2, promise3);
  });

  assert_equals(typeof update[0].state, 'string');
  assert_in_array(
      update[0].state, ['nominal', 'fair', 'serious', 'critical'],
      'cpu pressure state');
}, 'PressureObserver.observe() is idempotent');
