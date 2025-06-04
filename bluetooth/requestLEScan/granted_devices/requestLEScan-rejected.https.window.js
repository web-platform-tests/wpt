// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=/bluetooth/resources/bluetooth-test.js
// META: script=/bluetooth/resources/bluetooth-fake-devices.js
'use strict';
const test_desc = 'requestLEScan for granted device rejected';

bluetooth_test(async (t) => {
  let health_thermometer_device =
      (await getDiscoveredHealthThermometerDevice()).device;

  fake_central.simulateScanRequestResult(false);

  return promise_rejects_dom(
      t, 'NotFoundError',
      navigator.bluetooth.requestLEScan(
          {deviceIds: [health_thermometer_device.id]}));
}, test_desc);
