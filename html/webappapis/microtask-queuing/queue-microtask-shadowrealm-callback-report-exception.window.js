// META: title=Errors thrown by wrapped microtask in ShadowRealm

setup({ allow_uncaught_exception: true });

const realm = new ShadowRealm();

const onerrorCalls = [];
window.onerror = e => {
  onerrorCalls.push("Window");
};
realm.evaluate(`(push) => {
  onerror = function (e) {
    const assertResult = e instanceof TypeError;
    push(assertResult);
  };
}`)(assertResult => {
  onerrorCalls.push("ShadowRealm");
  assert_true(assertResult,
    "exception should be converted to a fresh ShadowRealm TypeError")
});

async_test(t => {
  window.onload = t.step_func(() => {
    const task = () => { throw new Error("will be converted to TypeError"); };
    realm.evaluate(`queueMicrotask`)(task);

    t.step_timeout(() => {
      assert_array_equals(onerrorCalls, ["ShadowRealm"],
        "exception should only be reported in ShadowRealm's onerror handler");
      t.done();
    }, 4);
  });
});
