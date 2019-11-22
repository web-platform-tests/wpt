async_test(t => {
  const frame = document.body.appendChild(document.createElement('iframe'));
  document.domain = document.domain;
  frame.src = "/common/blank.html";
  frame.onload = t.step_func_done(() => {
    // Ensure we cannot access the child browsing context after navigation
    assert_throws("SecurityError", () => window[0].document);
  });
}, "Navigated frame and document.domain");
