'use strict';

function isPlatformSupported() {
  if (navigator.platform.indexOf('Android') != -1)
    return false;
  return true;
}

function compute_pressure_test(test_function, name, properties) {
  return promise_test(async t => {
    if (!isPlatformSupported()) {
      const observer = new ComputePressureObserver(() => {});
      await promise_rejects_dom(t, 'NotSupportedError', observer.start());
      return;
    }
    await test_function(t, name, properties);
  });
}
