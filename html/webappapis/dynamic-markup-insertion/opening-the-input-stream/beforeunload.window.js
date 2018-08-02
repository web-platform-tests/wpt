async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => frame.remove());
  frame.src = "/common/blank.html";
  frame.onload = t.step_func(() => {
    frame.contentWindow.onbeforeunload = t.unreached_func("beforeunload should not be fired");
    frame.contentDocument.open();
    t.step_timeout(t.step_func_done(() => {
      frame.contentDocument.close();
    }), 500);
  });
}, "document.open() and the beforeunload event");
