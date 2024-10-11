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
