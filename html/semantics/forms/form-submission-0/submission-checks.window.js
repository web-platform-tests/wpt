async_test(t => {
  const frame = document.createElement("frame"),
        form = document.createElement("form");
  t.add_cleanup(() => frame.remove());
  form.action = "/common/blank.html";
  form.target = "doesnotmattertwobits";
  frame.name = "doesnotmattertwobits";
  document.body.appendChild(frame);
  frame.onload = t.step_func(() => {
    if(frame.contentWindow.location.href === "about:blank")
      return;
    assert_unreached();
  });
  form.submit();
  t.step_timeout(() => t.done(), 500);
}, "<form> not connected to a document cannot navigate");

async_test(t => {
  const frame = document.createElement("frame"),
        form = document.createElement("form");
  t.add_cleanup(() => frame.remove());
  form.action = "/";
  document.body.appendChild(frame);
  frame.contentDocument.body.appendChild(form);
  frame.onload = t.step_func(() => {
    if(frame.contentWindow.location.href === "about:blank")
      return;
    form.submit();
    t.step_timeout(() => {
      assert_equals(frame.contentWindow.location.pathname, "/common/blank.html");
      t.done();
    }, 500)
  });
  frame.src = "/common/blank.html";
}, "<form> in a navigated document cannot navigate");
