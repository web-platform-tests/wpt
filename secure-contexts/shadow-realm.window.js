// META: title=Test ShadowRealm isSecureContext for HTTP creator

test(() => {
  const realm = new ShadowRealm();
  assert_false(realm.evaluate("isSecureContext"), "isSecureContext should be false");
}, "ShadowRealm isSecureContext is false when created from an insecure Window context");

test(() => {
  const outerRealm = new ShadowRealm();
  assert_false(outerRealm.evaluate(`
    const innerRealm = new ShadowRealm();
    innerRealm.evaluate('isSecureContext');
  `), "isSecureContext should be false");
}, "ShadowRealm isSecureContext is false when created from an insecure ShadowRealm context");

async_test(t => {
  const worker = new Worker(`data:text/javascript,postMessage(new ShadowRealm().evaluate('isSecureContext'))`);
  worker.onmessage = t.step_func_done(function(e) {
    assert_false(e.data, "isSecureContext should be false");
  });
  worker.onerror = t.step_func_done(function(e) {
    assert_unreached("isSecureContext should be supported");
  });
}, "ShadowRealm isSecureContext is false when created from an insecure Worker context");

async_test(t => {
  const worker = new SharedWorker(
    `data:text/javascript,addEventListener("connect", function (e) {
       var port = e.ports[0];
       port.start();
       port.postMessage(new ShadowRealm().evaluate('isSecureContext'));
    });`
  );
  worker.port.onmessage = t.step_func_done(function(e) {
    assert_false(e.data, "isSecureContext should be false");
  });
  worker.port.onerror = t.step_func_done(function(e) {
    assert_unreached("isSecureContext should be supported");
  });
  worker.port.start();
}, "ShadowRealm isSecureContext is false when created from an insecure SharedWorker context");
