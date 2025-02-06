'use strict';

/**
 * Waits until the document has finished loading.
 * @returns {Promise<void>} Resolves if the document is already completely
 *     loaded or when the 'onload' event is fired.
 */
function waitForDocumentReady() {
  return new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve();
    }

    window.addEventListener('load', () => {
      resolve();
    }, {once: true});
  });
}

/**
 * Simulates a user activation prior to running |callback|.
 * @param {Function} callback The function to run after the user activation.
 * @returns {Promise<*>} Resolves when the user activation has been simulated
 *     with the result of |callback|.
 */
async function callWithTrustedClick(callback) {
  await waitForDocumentReady();
  return new Promise(resolve => {
    let button = document.createElement('button');
    button.textContent = 'click to continue test';
    button.style.display = 'block';
    button.style.fontSize = '20px';
    button.style.padding = '10px';
    button.onclick = () => {
      document.body.removeChild(button);
      resolve(callback());
    };
    document.body.appendChild(button);
    test_driver.click(button);
  });
}

/**
 * Register a one-time handler that selects the first device in the device
 * prompt upon a device prompt updated event.
 */
function selectFirstDeviceOnDevicePromptUpdated() {
  test_driver.bidi.bluetooth.request_device_prompt_updated.once().then(
      (promptEvent) => {
        assert_greater_than_equal(promptEvent.devices.length, 0);
        test_driver.bidi.bluetooth.handle_request_device_prompt({
          prompt: promptEvent.prompt,
          accept: true,
          device: promptEvent.devices[0].id
        });
      });
}

/**
 * Calls requestDevice() in a context that's 'allowed to show a popup'.
 * @returns {Promise<BluetoothDevice>} Resolves with a Bluetooth device if
 *     successful or rejects with an error.
 */
function requestDeviceWithTrustedClick() {
  let args = arguments;
  return callWithTrustedClick(
      () => navigator.bluetooth.requestDevice.apply(navigator.bluetooth, args));
}

/**
 * Function to test that a promise rejects with the expected error type and
 * message.
 * @param {Promise} promise
 * @param {object} expected
 * @param {string} description
 * @returns {Promise<void>} Resolves if |promise| rejected with |expected|
 *     error.
 */
function assert_promise_rejects_with_message(promise, expected, description) {
  return promise.then(
      () => {
        assert_unreached('Promise should have rejected: ' + description);
      },
      error => {
        assert_equals(error.name, expected.name, 'Unexpected Error Name:');
        if (expected.message) {
          assert_true(
              error.message.includes(expected.message),
              'Unexpected Error Message:');
        }
      });
}
