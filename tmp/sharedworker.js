importScripts("/resources/testharness.js");
debugger;
try {
  DEBUG_PORT.postMessage("START")
  console.log = msg => DEBUG_PORT.postMessage(msg)
  console.log("Starting SharedWorker")

  const fetchAdaptor = (resource) => (resolve, reject) =>
    fetch(resource)
      .then(res => res.text(), String)
      .then(resolve, reject);

  console.log(`fetchAdaptor = ${fetchAdaptor}`)

  const r = new ShadowRealm();
  console.log(`r = ${r}`)

  const f = r.evaluate(`function f(log) { globalThis.log = log; undefined }; f`)
  f(console.log);

  const setShadowRealmGlobalProperties = r.evaluate(`

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
    undefined;
  }
  setShadowRealmGlobalProperties

  `);
  const result = setShadowRealmGlobalProperties("", fetchAdaptor);

  console.log(`evaluated first block result = ${result}`)

  const promise_creator = r.evaluate(`
  (resolve, reject) => {
    log("Creating promise");
    (async () => {
      log("Will import")
      try {
        await import("/resources/testharness.js");
        await import("/dom/idlharness.any.js");
      } catch (e) {
        log("error from import()");
        log(e.toString());
        throw e;
      }
      log("Have imported")
    })().then(resolve, (e) => reject(e.toString()));
  }
  `);

  console.log(`promise_creator = ${promise_creator}`)

  new Promise(promise_creator).then(() => {
    console.log("resolved promise in shared worker")
    function forwardMessage(msgJSON) {
      postMessage(JSON.parse(msgJSON))
    }
    r.evaluate('begin_shadow_realm_tests')(forwardMessage);
  });

  } catch (e) {
    console.log(e)
  }
