async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe")),
        frameW = frame.contentWindow;
  frameW.perGlobalVariable = "heya";
  frame.onload = t.step_func_done(() => {
    assert_equals(frameW.perGlobalVariable, "heya");
  });
  frame.src = "/common/blank.html";
}, "Navigating from initial about:blank and the global object");
