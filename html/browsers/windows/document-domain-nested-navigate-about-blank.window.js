async_test(t => {
  const frame = document.body.appendChild(document.createElement('iframe'));
  document.domain = document.domain;
  frame.src = "/common/blank.html";
  frame.onload = t.step_func(() => {
    frame.src = "about:blank";
    frame.onload = t.step_func_done(() => {
      // Ensure we can access the child browsing context after navigation to non-initial about:blank
      assert_equals(window[0].document, frame.contentDocument);
    });
  });
}, "Navigated frame to about:blank and document.domain");
