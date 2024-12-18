// META: global=window-module
// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=/notifications/resources/helpers.js
// META: variant=?includeAppServerKey=true
// META: variant=?includeAppServerKey=false

import { encrypt } from "./resources/helpers.js"
import { createVapid } from "./resources/vapid.js";

const includeAppServerKey = new URL(location.href).searchParams.get("includeAppServerKey") === "true";
let registration;

async function subscribe(t) {
  if (includeAppServerKey) {
    const vapid = await createVapid();
    const subscription = await registration.pushManager.subscribe({
      applicationServerKey: vapid.publicKey
    });
    t.add_cleanup(() => subscription.unsubscribe());
    return { vapid, subscription };
  }

  // without key
  try {
    const subscription = await registration.pushManager.subscribe();
    t.add_cleanup(() => subscription.unsubscribe());
    return { subscription };
  } catch (err) {
    if (err.name === "NotSupportedError") {
      // happens if and only if applicationServerKey omission is disallowed,
      // which is permitted per the spec. Throwing OptionalFeatureUnsupportedError marks the
      // result as PRECONDITION_FAILED.
      //
      // https://w3c.github.io/push-api/#subscribe-method
      // If the options argument does not include a non-null value for the applicationServerKey
      // member, and the push service requires one to be given, queue a global task on the
      // networking task source using global to reject promise with a "NotSupportedError"
      // DOMException.
      throw new OptionalFeatureUnsupportedError(description);
    } else {
      throw err;
    }
  }
}

async function pushMessage(subscription, { vapid, message }) {
  const result = !message
    ? { headers: { TTL: 15 } }
    : await encrypt(
      message,
      subscription.getKey("p256dh"),
      subscription.getKey("auth")
    );

  if (includeAppServerKey) {
    result.headers.Authorization = await vapid.generateAuthHeader(
      new URL(subscription.endpoint).origin
    );
  }

  const promise = new Promise(r => {
    navigator.serviceWorker.addEventListener("message", r, { once: true })
  });

  await fetch(subscription.endpoint, {
    method: "post",
    ...result
  });

  return (await promise).data;
}

promise_setup(async () => {
  await trySettingPermission("granted");
  registration = await getActiveServiceWorker("push-sw.js");
});

promise_test(async (t) => {
  const { vapid, subscription } = await subscribe(t);

  const data = await pushMessage(subscription, { vapid });

  assert_equals(data.constructor, "PushEvent");
  assert_equals(data.data, null);
}, "Posting to the push endpoint should fire push event on the service worker");

promise_test(async (t) => {
  const { vapid, subscription } = await subscribe(t);

  const data = await pushMessage(subscription, {
    vapid,
    message: new TextEncoder().encode("Hello"),
  });

  assert_equals(data.constructor, "PushEvent");
  assert_equals(new TextDecoder().decode(data.data), "Hello");
}, "Posting to the push endpoint with encrypted data should fire push event on the service worker");
