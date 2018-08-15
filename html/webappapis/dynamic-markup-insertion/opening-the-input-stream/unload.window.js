// In an earlier version of the HTML Standard, document open steps had "unload
// document" as a step. Test that this no longer happens.

async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  frame.src = "/common/blank.html";
  frame.onload = t.step_func_done(() => {
    frame.contentWindow.onpagehide = t.unreached_func("onpagehide got called");
    frame.contentDocument.onvisibilitychange = t.unreached_func("onvisibilitychange got called");
    frame.contentWindow.onunload = t.unreached_func("onunload got called");
    frame.contentDocument.open();
    frame.contentDocument.close();
  });
}, "document.open(): Do not fire pagehide, visibilitychange, or unload events");
