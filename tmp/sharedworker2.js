
importScripts("/resources/testharness.js");
globalThis.DEBUG_LOG("after import")

const fetchAdaptor = (resource) => (resolve, reject) =>
  fetch(resource)
    .then(res => res.text(), String)
    .then(resolve, reject);

const r = new ShadowRealm();

const f = r.evaluate(`function f(log) { globalThis.log = log; undefined }; f`)
f(DEBUG_LOG);

r.evaluate(`
log("Evaluating first block")

function setShadowRealmGlobalProperties(queryString, fetchAdaptor) {
  globalThis.fetch_json = (resource) => {
    const thenMethod = fetchAdaptor(resource);
    return new Promise((resolve, reject) => thenMethod((s) => resolve(JSON.parse(s)), reject));
  };

  globalThis.GLOBAL = {
    isWindow: function() { return false; },
    isWorker: function() { return false; },
    isShadowRealm: function() { return true; },
  };

  globalThis.location = { search: queryString };

  // Remove definition of .self in future; should already be provided
  // according to https://github.com/whatwg/html/pull/9893
  globalThis.self = globalThis;
}
setShadowRealmGlobalProperties

`)("", fetchAdaptor);
new Promise(r.evaluate(`
  (resolve, reject) => {
    (async () => {
    await import("/resources/testharness.js");

    await import("/dom/idlharness.any.js");
  })().then(resolve, (e) => reject(e.toString()));
}
`)).then(() => {
  function forwardMessage(msgJSON) {
    DEBUG_LOG("globalThis.postMessage = " + globalThis.postMessage)
    globalThis.DEBUG_LOG(JSON.parse(msgJSON))
  }
  r.evaluate('begin_shadow_realm_tests')(forwardMessage);
});
