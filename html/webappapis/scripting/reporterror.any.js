setup({ allow_uncaught_exception:true });

test(t => {
  let happened = false;
  self.addEventListener("error", t.step_func(e => {
    assert_equals(e.error, 1);
    happened = true;
  }));
  self.reportError(1);
  assert_true(happened);
}, "self.reportError(1)");

test(t => {
  const throwable = new TypeError();
  let happened = false;
  self.addEventListener("error", t.step_func(e => {
    assert_equals(e.error, throwable);
    happened = true;
  }));
  self.reportError(throwable);
  assert_true(happened);
}, "self.reportError(obj)");
