// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=/notifications/resources/helpers.js

let registration;
let subscribeOptions;
let prompt_test_data = {
  setup_error: null,
  precondition_activation_present: false,
  consumed_immediately: undefined,
  consumed_after_task: undefined
};

promise_setup(async () => {
  // subscribe() validates the key before it reaches the activation step, so the key must be a real P-256 point.
  const keyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      /* extractable= */ false,
      ["deriveKey"]);
  const applicationServerKey = await crypto.subtle.exportKey("raw", keyPair.publicKey);

  subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey,
  };

  registration = await prepareActiveServiceWorker("noop-sw.js");

  // Only one subscribe() call with activation can run in the 'prompt' state: an automatic denial of the
  // prompt can leave the permission at 'denied' for the rest of the file.
  try {
    await trySettingPermission('prompt');
  } catch (e) {
    prompt_test_data.setup_error = new Error(`Could not set permission to 'prompt': ${e.message}`);
    return;
  }

  try {
    await test_driver.bless('subscribe with prompt permission', async () => {
      prompt_test_data.precondition_activation_present = navigator.userActivation.isActive;
      if (!prompt_test_data.precondition_activation_present) {
        return;
      }

      // The promise may never settle here; the catch only prevents an unhandled-rejection error.
      registration.pushManager.subscribe(subscribeOptions).catch(() => {});
      prompt_test_data.consumed_immediately = !navigator.userActivation.isActive;

      await new Promise(resolve => step_timeout(resolve, 0));
      prompt_test_data.consumed_after_task = !navigator.userActivation.isActive;
    });
  } catch (e) {
    prompt_test_data.setup_error = new Error(`Observation of 'prompt' behavior failed: ${e.message}`);
  }
});

promise_test(async t => {
  if (prompt_test_data.setup_error) throw prompt_test_data.setup_error;
  assert_true(prompt_test_data.precondition_activation_present,
    "Precondition: user activation must be active before calling subscribe().");
  assert_true(prompt_test_data.consumed_immediately,
    "User activation must be consumed by the time subscribe() returns.");
}, "subscribe() with permission 'prompt' consumes user activation immediately.");

promise_test(async t => {
  if (prompt_test_data.setup_error) throw prompt_test_data.setup_error;
  assert_true(prompt_test_data.precondition_activation_present,
    "Precondition: user activation must be active before calling subscribe().");
  assert_true(prompt_test_data.consumed_after_task,
    "User activation must still be consumed after a task has run.");
}, "subscribe() with permission 'prompt' leaves user activation consumed after a task.");

promise_test(async t => {
  await trySettingPermission("denied");

  let wasActiveImmediately;
  let wasActiveAfterTask;
  let subscribe_promise;
  await test_driver.bless("subscribe with 'denied' permission", async () => {
    assert_true(navigator.userActivation.isActive,
      "Precondition: user activation must be active when subscribe() is called.");
    subscribe_promise = promise_rejects_dom(
        t, "NotAllowedError", registration.pushManager.subscribe(subscribeOptions));
    wasActiveImmediately = navigator.userActivation.isActive;

    await new Promise(resolve => t.step_timeout(resolve, 0));
    wasActiveAfterTask = navigator.userActivation.isActive;
  });

  assert_true(wasActiveImmediately,
    "User activation must not be consumed by the time subscribe() returns.");
  assert_true(wasActiveAfterTask,
    "User activation must still be present after a task has run.");

  await subscribe_promise;
}, "subscribe() with permission 'denied' does not consume user activation.");

promise_test(async t => {
  await trySettingPermission("granted");

  let wasActiveImmediately;
  let wasActiveAfterTask;
  await test_driver.bless("subscribe with 'granted' permission", async () => {
    assert_true(navigator.userActivation.isActive,
      "Precondition: user activation must be active when subscribe() is called.");
    registration.pushManager.subscribe(subscribeOptions).catch(() => {});
    wasActiveImmediately = navigator.userActivation.isActive;

    await new Promise(resolve => t.step_timeout(resolve, 0));
    wasActiveAfterTask = navigator.userActivation.isActive;
  });

  assert_true(wasActiveImmediately,
    "User activation must not be consumed by the time subscribe() returns.");
  assert_true(wasActiveAfterTask,
    "User activation must still be present after a task has run.");
}, "subscribe() with permission 'granted' does not consume user activation.");
