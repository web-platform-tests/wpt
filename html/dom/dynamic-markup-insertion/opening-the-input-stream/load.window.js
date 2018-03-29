async_test(t => {
  const frame = document.createElement("iframe");
  frame.onload = t.step_func(() => {
    frame.contentDocument.open();
    frame.contentDocument.write("x");
  });

  self.addEventListener("load", t.step_func_done(e => {
    assert_true(e.whoa);
    assert_equals(frame.contentDocument.body.textContent, "x");
  }));

  document.body.appendChild(frame);

  t.step_timeout(() => {
    const event = new Event("load");
    event.whoa = true;
    // Note: this also triggers testharness.js
    self.dispatchEvent(event);
  })
}, "document.open() delays the load event");
