async_test(t => {
  const iframe = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => iframe.remove());
  iframe.src = "/common/blank.html";
  iframe.onload = t.step_func_done(() => {
    assert_equals(iframe.contentWindow.history.state, null);
    iframe.contentWindow.history.replaceState("state", "");
    assert_equals(iframe.contentWindow.history.state, "state");
    iframe.contentDocument.open();
    assert_equals(iframe.contentWindow.history.state, "state");
  });
}, "history.state is kept by document.open()");

async_test(t => {
  const iframe = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => iframe.remove());
  iframe.src = "/common/blank.html";
  iframe.onload = t.step_func_done(() => {
    assert_equals(iframe.contentWindow.history.state, null);
    iframe.contentWindow.history.replaceState("state", "");
    assert_equals(iframe.contentWindow.history.state, "state");
    iframe.contentDocument.open("", "replace");
    assert_equals(iframe.contentWindow.history.state, "state");
  });
}, "history.state is kept by document.open() (with historical replace parameter set)");
