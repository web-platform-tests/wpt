// testharness file with ShadowRealm utilities to be imported in the realm
// hosting the ShadowRealm

/**
 * Convenience function for evaluating some async code in the ShadowRealm and
 * waiting for the result.
 *
 * @param {ShadowRealm} realm - the ShadowRealm to evaluate the code in
 * @param {string} asyncBody - the code to evaluate; will be put in the body of
 *   an async function, and must return a value explicitly if a value is to be
 *   returned to the hosting realm.
 */
globalThis.shadowRealmEvalAsync = function (realm, asyncBody) {
  return new Promise(realm.evaluate(`
    (resolve, reject) => {
      (async () => {
        ${asyncBody}
      })().then(resolve, (e) => reject(e.toString()));
    }
  `));
};

/**
 * Convenience adaptor function for fetch() that can be passed to
 * setShadowRealmGlobalProperties() (see testharness-shadowrealm-inner.js).
 * Used to adapt the hosting realm's fetch(), if present, to fetch a resource
 * and pass its text through the callable boundary to the ShadowRealm.
 */
globalThis.fetchAdaptor = (resource) => (resolve, reject) => {
  fetch(resource)
    .then(res => res.text())
    .then(resolve, (e) => reject(e.toString()));
};

let sharedWorkerMessagePortPromise;
/**
 * Used when the hosting realm is a worker. This value is a Promise that
 * resolves to a function that posts a message to the worker's message port,
 * just like postMessage(). The message port is only available asynchronously in
 * SharedWorkers.
 */
globalThis.getPostMessageFunc = async function () {
  if (typeof postMessage === "function") {
    return postMessage;  // postMessage available directly in dedicated worker
  }

  if (sharedWorkerMessagePortPromise) {
    return await sharedWorkerMessagePortPromise;
  }

  throw new Error("getPostMessageFunc is intended for Worker scopes");
}

// Port available asynchronously in shared worker, but not via an async func
let savedResolver;
if (globalThis.constructor.name === "SharedWorkerGlobalScope") {
  sharedWorkerMessagePortPromise = new Promise((resolve) => {
    savedResolver = resolve;
  });
  addEventListener("connect", function (event) {
    const port = event.ports[0];
    savedResolver(port.postMessage.bind(port));
  });
}
