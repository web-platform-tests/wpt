async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => frame.remove());

  frame.onload = t.step_func_done(() => {
    // Per discussion in https://github.com/whatwg/html/issues/6556 and related threads, this will change the document's
    // URL, but will *not* update the session history entry's URL.
    frame.contentDocument.open();
    assert_equals(frame.contentDocument.URL, document.URL, "Precondition: the URL gets changed");

    frame.contentWindow.history.pushState(null, "");
    assert_equals(frame.contentDocument.URL, document.URL, "pushState() must set the URL to the document's current URL");
  });

  frame.src = "/common/blank.html";
}, "pushState() must use the document's current URL (which document.open() sets), not the session history entry's current URL (which it doesn't)");

async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => frame.remove());

  frame.onload = t.step_func_done(() => {
    // Per discussion in https://github.com/whatwg/html/issues/6556 and related threads, this will change the document's
    // URL, but will *not* update the session history entry's URL.
    frame.contentDocument.open();
    assert_equals(frame.contentDocument.URL, document.URL, "Precondition: the URL gets changed");

    frame.contentWindow.history.replaceState(null, "");
    assert_equals(frame.contentDocument.URL, document.URL, "replaceState() must set the URL to the document's current URL");
  });

  frame.src = "/common/blank.html";
}, "replaceState() must use the document's current URL (which document.open() sets), not the session history entry's current URL (which it doesn't)");
