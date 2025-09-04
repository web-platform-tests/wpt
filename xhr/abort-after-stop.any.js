// META: title=XMLHttpRequest: abort event should fire when abort() is used

async_test(t => {
  const client = new XMLHttpRequest();
  let abortFired = false;
  let sync = true;

  client.onabort = t.step_func(e => {
    assert_false(sync, "abort should be async");
    assert_equals(e.type, "abort");
    assert_equals(client.status, 0);
    abortFired = true;
  });

  client.open("GET", "resources/delay.py?ms=3000", true);
  client.send();

  t.step_timeout(() => {
    assert_true(abortFired, "abort event should have fired");
    t.done();
  }, 200);

  client.abort(); // portable across window, worker, shared worker, etc.
  sync = false;
});
