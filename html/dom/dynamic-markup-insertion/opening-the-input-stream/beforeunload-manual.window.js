async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  let happened = false;
  frame.src = "/common/blank.html";
  frame.onload = t.step_func(() => {
    frame.contentWindow.onbeforeunload = t.step_func(() => {
      happened = true;
    });
  });
  const button = document.body.appendChild(document.createElement("button"));
  button.textContent = "Click me to start!";
  button.onclick = t.step_func_done(() => {
    frame.contentDocument.open();
    assert_true(happened);
    frame.contentDocument.close();
  });
}, "document.open() and the beforeunload event");
