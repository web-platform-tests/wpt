// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=/bluetooth/resources/bluetooth-test.js
// META: script=/bluetooth/resources/bluetooth-fake-devices.js
'use strict';
const test_desc = 'requestLEScan for granted device and scanningstopped event';

bluetooth_test(async (t) => {
  let healthThermometerDevice =
      (await getDiscoveredHealthThermometerDevice()).device;
  let scan = await navigator.bluetooth.requestLEScan(
      {deviceIds: [healthThermometerDevice.id]});

  const eventWatcher = new EventWatcher(t, scan, ['scanningstopped']);
  let scanningStoppedPomise = eventWatcher.wait_for('scanningstopped');

  scan.stop();
  await scanningStoppedPomise;
}, test_desc);
