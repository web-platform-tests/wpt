async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  frame.src = "resources/variables-frame.html";
  frame.onload = t.step_func_done(() => {
    assert_equals(frame.contentWindow.hey, "You", "precondition");
    frame.contentDocument.open();
    assert_equals(frame.contentWindow.hey, "You", "actual check");
    // Ensure a load event gets dispatched to unblock testharness
    frame.contentDocument.close();
  });
}, "Obtaining a variable from a global whose document had open() invoked");
