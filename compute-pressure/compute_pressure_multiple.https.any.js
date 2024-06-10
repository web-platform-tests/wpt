// META: script=/resources/test-only-api.js
// META: script=resources/pressure-helpers.js
// META: global=window,dedicatedworker,sharedworker

'use strict';

pressure_test(async (t, mockPressureService) => {
  const changes1_promise = new Promise((resolve, reject) => {
    const observer = new PressureObserver(resolve);
    t.add_cleanup(() => observer.disconnect());
    observer.observe('cpu').catch(reject);
  });

  const changes2_promise = new Promise((resolve, reject) => {
    const observer = new PressureObserver(resolve);
    t.add_cleanup(() => observer.disconnect());
    observer.observe('cpu').catch(reject);
  });

  const changes3_promise = new Promise((resolve, reject) => {
    const observer = new PressureObserver(resolve);
    t.add_cleanup(() => observer.disconnect());
    observer.observe('cpu').catch(reject);
  });

  mockPressureService.setPressureUpdate('cpu', 'critical');
  mockPressureService.startPlatformCollector(/*sampleInterval=*/ 200);

  const [changes1, changes2, changes3] =
      await Promise.all([changes1_promise, changes2_promise, changes3_promise]);

  for (const changes of [changes1, changes2, changes3]) {
    assert_equals(changes[0].state, 'critical');
  }
}, 'Three PressureObserver instances receive changes');

pressure_test(async (t, mockPressureService) => {
  await new Promise(async (resolve) => {
    const observer1 = new PressureObserver(() => {
      assert_unreached("The observer callback should not be called");
    });
    const observer2 = new PressureObserver(resolve);
    t.add_cleanup(() => {
      observer1.disconnect();
      observer2.disconnect();
    });

    const promise1 = observer1.observe("cpu");
    const promise2 = observer2.observe("cpu");
    observer1.disconnect();
    await Promise.all([
      promise_rejects_dom(t, "AbortError", promise1),
      promise2,
    ]);

    mockPressureService.setPressureUpdate("cpu", "critical");
    mockPressureService.startPlatformCollector(/*sampleInterval=*/ 200);
  });
}, "Disconnecting an observer does not affect one that is still connecting");

pressure_test(async (t, mockPressureService) => {
  mockPressureService.setExpectedFailure(
    new DOMException("", "NotSupportedError")
  );

  const observer1 = new PressureObserver(() => {
    assert_unreached("The observer1 callback should not be called");
  });
  const observer2 = new PressureObserver(() => {
    assert_unreached("The observer2 callback should not be called");
  });
  t.add_cleanup(() => {
    observer1.disconnect();
    observer2.disconnect();
  });

  await promise_rejects_dom(t, "NotSupportedError", observer1.observe("cpu"));
  await promise_rejects_dom(t, "NotSupportedError", observer2.observe("cpu"));
}, "Multiple observers reject with NotSupportedError");
