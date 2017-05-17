async_test(t => {
  const c = new AbortController(),
        s = c.signal;
  let state = "begin";

  assert_false(s.aborted);

  s.addEventListener("abort",
    t.step_func_done(e => {
      assert_equals(state, "begin");
      state = "aborted";
    })
  );
  c.abort();

  assert_equals(state, "aborted");
  assert_true(s.aborted);

  t.done();
}, "AbortController() basics");

done();
