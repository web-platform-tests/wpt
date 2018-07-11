window.handlers = {};

async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  frame.src = "resources/aborted-parser-frame.html";
  window.handlers.afterOpen = t.step_func(() => {
    const openCalled = frame.contentDocument.childNodes.length === 0;
    frame.remove();
    assert_true(openCalled, "child document should be empty");
    t.done();
  });
}, "document.open() after parser is aborted");

async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  frame.src = "resources/aborted-parser-async-frame.html";
  window.handlers.afterOpenAsync = t.step_func(() => {
    const openCalled = frame.contentDocument.childNodes.length === 0;
    frame.remove();
    assert_true(openCalled, "child document should be empty");
    t.done();
  });
}, "async document.open() after parser is aborted");
