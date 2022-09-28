// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js
// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: timeout=long

// https://w3c.github.io/screen-wake-lock/

'use strict';

idl_test(
  ['screen-wake-lock'],
  ['dom', 'html'],
  async idl_array => {
    await test_driver.bless("screen wake lock");
    self.sentinel = await navigator.wakeLock.request('screen');
    await self.sentinel.release();
    idl_array.add_objects({ Navigator: ['navigator'] });

    idl_array.add_objects({
      WakeLock: ['navigator.wakeLock'],
      WakeLockSentinel: ['sentinel'],
    });
  }
);
