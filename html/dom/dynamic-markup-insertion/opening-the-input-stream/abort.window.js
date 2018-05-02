async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  frame.src = "/common/blank.html";
  frame.onload = t.step_func(() => {
    let happened = false;
    const client = new frame.contentWindow.XMLHttpRequest();
    client.open("GET", "/common/blank.html");
    client.onerror = t.step_func_done(e => {
      assert_true(happened);
      frame.contentDocument.close();
    });
    client.send();
    frame.contentDocument.open();
    happened = true;
  });
}, "document.open() and aborting documents");
