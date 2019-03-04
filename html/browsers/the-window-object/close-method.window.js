async_test(t => {
  const openee = window.open();
  assert_false(openee.closed);
  openee.close();
  assert_true(openee.closed);
  assert_equals(openee.opener, self);
  t.step_timeout(() => {
    assert_equals(openee.opener, null);
    t.done();
  }, 100);
}, "window.close() queues a task to discard, but window.closed knows immediately");

async_test(t => {
  const openee = window.open("", "greatname");
  assert_false(openee.closed);
  openee.close();
  assert_true(openee.closed);
  const openee2 = window.open("", "greatname");
  assert_not_equals(openee, openee2);

  assert_equals(openee.opener, self);
  openee2.close();
  assert_equals(openee2.opener, self);

  t.step_timeout(() => {
    assert_equals(openee.opener, null);
    assert_equals(openee2.opener, null);
    t.done();
  }, 100);
}, "window.close() affects name targeting immediately");
