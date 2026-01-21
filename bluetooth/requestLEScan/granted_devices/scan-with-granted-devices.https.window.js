// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=/bluetooth/resources/bluetooth-test.js
// META: script=/bluetooth/resources/bluetooth-fake-devices.js
'use strict';
const test_desc = 'requestLEScan for two granted devices.';

bluetooth_test(async (t) => {
  let health_thermometer_device;
  let heart_rate_device;
  {
    let {device} = await getDiscoveredHealthThermometerDevice();
    health_thermometer_device = device;
  }
  {
    let {device} = await getHeartRateDevice(
        {requestDeviceOptions: heartRateRequestDeviceOptionsDefault});
    heart_rate_device = device;
  }

  let devices = [health_thermometer_device, heart_rate_device];
  let deviceIds = devices.map((device) => device.id);
  // deviceIds and filters should not co-exist.
  await promise_rejects_js(
      t, TypeError,
      navigator.bluetooth.requestLEScan({deviceIds: deviceIds, filters: []}));
  // deviceIds and acceptAllAdvertisements being true should not co-exist.
  await promise_rejects_js(
      t, TypeError,
      navigator.bluetooth.requestLEScan(
          {deviceIds: deviceIds, acceptAllAdvertisements: true}));

  // Start scan and check the returned BluetoothLEScan object.
  let scan = await navigator.bluetooth.requestLEScan({deviceIds: deviceIds});
  assert_equals(scan.deviceIds.length, devices.length);
  for (let i = 0; i < scan.deviceIds.length; i++) {
    assert_equals(scan.deviceIds[i], devices[i].id);
  }
  assert_true(scan.active);

  // Simulate advertisements from devices.
  const eventWatcher =
      new EventWatcher(t, navigator.bluetooth, ['advertisementreceived']);
  let advertisementreceivedPromise =
      eventWatcher.wait_for('advertisementreceived');
  await fake_central.simulateAdvertisementReceived(heart_rate_ad_packet);
  let heartEvt = await advertisementreceivedPromise;
  assert_equals(heartEvt.device, heart_rate_device);

  advertisementreceivedPromise = eventWatcher.wait_for('advertisementreceived');
  await fake_central.simulateAdvertisementReceived(
      health_thermometer_ad_packet);
  let healthEvt = await advertisementreceivedPromise;
  assert_equals(healthEvt.device, health_thermometer_device);

  // After scan stopped, advertisements should not cause event to fired.
  scan.stop();
  assert_false(scan.active);
  await fake_central.simulateAdvertisementReceived(heart_rate_ad_packet);
  await fake_central.simulateAdvertisementReceived(
      health_thermometer_ad_packet);
}, test_desc);
