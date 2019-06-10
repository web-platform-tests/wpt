// META: global=window,worker

setup({allow_uncaught_exception:true});

promise_test(async testCase => {
  const error = new Error("boo");
  const eventReceived = new Promise((resolve,reject) => {
    self.addEventListener("error", ev => {
      assert_equals(ev.error, error);
      resolve();
    });
  });
  queueMicrotask(() => { throw error; });
  await eventReceived;
}, 'error catching test');

