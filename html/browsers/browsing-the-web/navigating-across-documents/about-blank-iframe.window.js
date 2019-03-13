async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe")),
        frameW = frame.contentWindow,
        path = "/common/blank.html";
  frameW.perGlobalVariable = "heya";
  frame.onload = t.step_func_done(() => {
    assert_equals(frameW.location.pathname, path);
    assert_equals(frameW.perGlobalVariable, "heya");
  });
  frame.src = path;
}, "Navigating from initial about:blank and the global object");
