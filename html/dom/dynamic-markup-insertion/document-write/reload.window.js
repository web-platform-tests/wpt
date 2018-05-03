async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  let reloaded = false;
  frame.src = "/common/blank.html";
  frame.onload = t.step_func(() => {
    if (reloaded) {
        assert_equals(frame.contentDocument.body.textContent, "");
        t.done();
        return;
    }
    assert_false(reloaded);
    assert_equals(frame.contentDocument.body.textContent, "");
    frame.contentDocument.write("Hey");
    assert_equals(frame.contentDocument.body.textContent, "Hey");
    reloaded = true;
    frame.contentWindow.location.reload();
  });
}, "document.write() and reloading");

async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  let reloaded = false;
  frame.onload = t.step_func(() => {
    if (reloaded) {
        assert_equals(frame.contentDocument.body.textContent, "");
        t.done();
        return;
    }
  });
  assert_equals(frame.contentDocument.body.textContent, "");
  frame.contentDocument.write("Hey");
  assert_equals(frame.contentDocument.body.textContent, "Hey");
  reloaded = true;
  frame.contentWindow.location.reload();
}, "document.write() and reloading, part 2");
