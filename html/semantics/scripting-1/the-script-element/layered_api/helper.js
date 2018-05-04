var fallback_count = 0;

function expect_fallback(test) {
  test.step_func_done(() => {
    var actual_fallback_count = fallback_count;
    fallback_count = 0;
    assert_equals(actual_fallback_count, 1, 'Fallback must be evaluated once');
  })();
}

function expect_no_fallback(test) {
  test.step_func_done(() => {
    var actual_fallback_count = fallback_count;
    fallback_count = 0;
    assert_equals(actual_fallback_count, 0, 'Fallback must not be evaluated');
  })();
}

function expect_fallback_promise(p) {
  return p.then(() => {
    var actual_fallback_count = fallback_count;
    fallback_count = 0;
    assert_equals(actual_fallback_count, 1, 'Fallback must be evaluated once');
  });
}
