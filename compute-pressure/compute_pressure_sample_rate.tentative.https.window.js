// META: script=/resources/test-only-api.js
// META: script=resources/pressure-helpers.js

'use strict';

pressure_test(async (t, mockPressureService) => {
  const readings = ['nominal', 'fair', 'serious', 'critical'];

  const sampleRate = 0.5;
  const doubleSampleRate = 2 * sampleRate;
  const pressureChanges = await new Promise(async resolve => {
    const observer1Changes = [];
    const observer2Changes = [];
    const observer1 = new PressureObserver(changes => {
      observer1Changes.push(changes);
    }, {sampleRate});


    const observer2 = new PressureObserver(changes => {
      observer2Changes.push(changes);
    }, {doubleSampleRate});
    observer1.observe('cpu');
    observer2.observe('cpu');

    mockPressureService.startPlatformCollector();
    let i = 0;
    // mockPressureService.updatesDelivered() does not necessarily match
    // pressureChanges.length, as system load and browser optimizations can
    // cause the actual timer used by mockPressureService to deliver readings
    // to be a bit slower or faster than requested.
    while (observer2Changes.length < 6) {
      mockPressureService.setPressureUpdate(readings[i++ % readings.length]);
      await t.step_wait(
          () => mockPressureService.updatesDelivered() >= i,
          `At least ${i} readings have been delivered`);
    }
    observer1.disconnect();
    observer2.disconnect();

    const observerChanges = [observer1Changes, observer2Changes];
    resolve(observerChanges);
  });

  assert_equals(pressureChanges[1].length, 6);

  assert_greater_than_equal(
      pressureChanges[0][1][0].time - pressureChanges[0][0][0].time,
      (1 / sampleRate * 1000));
  assert_greater_than_equal(
      pressureChanges[0][2][0].time - pressureChanges[0][1][0].time,
      (1 / sampleRate * 1000));
  assert_greater_than_equal(
      pressureChanges[1][1][0].time - pressureChanges[1][0][0].time,
      (1 / doubleSampleRate * 1000));
  assert_greater_than_equal(
      pressureChanges[1][2][0].time - pressureChanges[1][1][0].time,
      (1 / doubleSampleRate * 1000));
}, 'frame rate: Observers with different frame rates should get changes at their respective frame rate');
