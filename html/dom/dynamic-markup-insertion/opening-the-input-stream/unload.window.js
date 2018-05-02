async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  frame.src = "/common/blank.html";
  frame.onload = t.step_func_done(() => {
    let happened = 0;
    frame.contentWindow.onpagehide = frame.contentWindow.onunload = t.step_func(() => {
      happened++;
    });
    frame.contentDocument.open();
    assert_equals(happened, 2);
    frame.contentDocument.close();
  });
}, "document.open() and the unload event");
