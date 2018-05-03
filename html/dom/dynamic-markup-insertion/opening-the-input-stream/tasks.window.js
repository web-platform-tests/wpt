async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  let happened = false;
  frame.contentWindow.setTimeout(() => happened = true, 100);
  frame.contentDocument.open();
  t.step_timeout(() => {
    assert_true(happened);
    t.done();
  }, 200);
  // Ensure the load event fires and testharness doesn't timeout
  frame.contentDocument.close();
}, "document.open() and tasks");
