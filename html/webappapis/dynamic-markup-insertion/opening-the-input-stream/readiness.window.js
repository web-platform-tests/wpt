async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  frame.src = "/common/blank.html";
  frame.onload = t.step_func_done(() => {
    const states = [];
    const onreadystatechange = t.step_func(() => {
      states.push(frame.contentDocument.readyState);
    });
    frame.contentDocument.onreadystatechange = onreadystatechange;
    assert_equals(frame.contentDocument.readyState, "complete");
    frame.contentDocument.open();
    // open() removes event listeners so adding another one
    frame.contentDocument.onreadystatechange = onreadystatechange;
    assert_equals(frame.contentDocument.readyState, "loading");
    frame.contentDocument.close();
    assert_equals(frame.contentDocument.readyState, "complete");
    assert_array_equals(states, ["interactive", "complete"]);
  });
}, "document.open() and readiness");
