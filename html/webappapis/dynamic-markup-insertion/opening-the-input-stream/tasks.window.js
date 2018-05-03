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
}, "document.open() and tasks (timeout)");

async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  let counter = 0;
  frame.contentWindow.onmessage = t.step_func(e => {
    assert_equals(e.data, undefined);
    counter++;
    alert(counter);
    if (counter == 2) {
      t.done();
    }
  });
  frame.contentWindow.postMessage(undefined, "*");
  frame.contentDocument.open();
  frame.contentWindow.postMessage(undefined, "*");
  // Ensure the load event fires and testharness doesn't timeout
  frame.contentDocument.close();
}, "document.open() and tasks (message)");
