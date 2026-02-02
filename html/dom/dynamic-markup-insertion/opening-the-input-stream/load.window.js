async_test(t => {
  const frame = document.createElement("iframe");
  let happened = false;

  self.addEventListener("load", t.step_func(e => {
    assert_true(e.whoa);
    assert_equals(frame.contentDocument.body.textContent, "x");
    happened = true;
    frame.contentDocument.close();
  }));

  document.body.appendChild(frame);
  frame.contentDocument.open();
  frame.contentDocument.write("x");
  frame.onload = t.step_func_done(() => {
    assert_true(happened);
  });

  t.step_timeout(() => {
    const event = new Event("load");
    event.whoa = true;
    // Note: this also triggers testharness.js
    self.dispatchEvent(event);
  }, 100);
}, "document.open() delays the load event");
