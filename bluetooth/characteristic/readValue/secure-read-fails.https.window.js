// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=/bluetooth/resources/bluetooth-test.js
// META: script=/bluetooth/resources/bluetooth-fake-devices.js
'use strict';
const test_desc =
    'A secure read request succeeds and returns the characteristic\'s value.';
const expected = new DOMException(
    'GATT operation not authorized.', 'SecurityError');
const EXPECTED_VALUE = null

bluetooth_test(async () => {
  const {characteristic, fake_characteristic} =
      await getMeasurementIntervalCharacteristic(/*security=*/ 'passkey');
  await fake_characteristic.setNextReadResponse(
      GATT_INSUFFICIENT_AUTHENTICATION, EXPECTED_VALUE,
      /*auth_status=*/ 'invalid');
  await assert_promise_rejects_with_message(
      characteristic.readValue(), expected, 'authentication error.');
}, test_desc);
