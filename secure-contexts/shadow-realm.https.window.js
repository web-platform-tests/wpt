// META: title=Test ShadowRealm isSecureContext for HTTPS creator

test(() => {
  const realm = new ShadowRealm();
  assert_true(realm.evaluate("isSecureContext"), "isSecureContext should be true");
}, "ShadowRealm isSecureContext is true when created from a secure Window context");

test(() => {
  const outerRealm = new ShadowRealm();
  assert_true(outerRealm.evaluate(`
    const innerRealm = new ShadowRealm();
    innerRealm.evaluate('isSecureContext');
  `), "isSecureContext should be true");
}, "ShadowRealm isSecureContext is true when created from a secure ShadowRealm context");

async_test(t => {
  const worker = new Worker(`data:text/javascript,postMessage(new ShadowRealm().evaluate('isSecureContext'))`);
  worker.onmessage = t.step_func_done(function(e) {
    assert_true(e.data, "isSecureContext should be true");
  });
  worker.onerror = t.step_func_done(function(e) {
    assert_unreached("isSecureContext should be supported");
  });
}, "ShadowRealm isSecureContext is true when created from a secure Worker context");

async_test(t => {
  const worker = new SharedWorker(
    `data:text/javascript,addEventListener("connect", function (e) {
       var port = e.ports[0];
       port.start();
       port.postMessage(new ShadowRealm().evaluate('isSecureContext'));
    });`
  );
  worker.port.onmessage = t.step_func_done(function(e) {
    assert_true(e.data, "isSecureContext should be true");
  });
  worker.port.onerror = t.step_func_done(function(e) {
    assert_unreached("isSecureContext should be supported");
  });
  worker.port.start();
}, "ShadowRealm isSecureContext is true when created from a secure SharedWorker context");
