async_test(t => {
  // See also https://github.com/whatwg/html/issues/4428
  const frames = ["iframe", "iframe"].map(val => document.createElement(val));
  frames[0].srcdoc = "<iframe></iframe>";
  frames[1].name = "thename";
  document.body.append(...frames);
  t.add_cleanup(() => { frames.map(val => val.remove()) });
  frames[0].onload = t.step_func(() => {
    const frameWs = frames.map(val => val.contentWindow),
          deepW = frameWs[0][0]
          openee = deepW.open("", "thename");
    assert_equals(openee, frameWs[1]);
    assert_equals(openee.opener, deepW);
    frames[0].onload = t.step_func_done(() => {
      // It'd be interesting to use something like history.back() here that works to see if it's
      // still null, but that doesn't seem possible.
      assert_equals(openee.opener, null);
    });
    frames[0].srcdoc = "";
  });
}, "Set opener browsing context to null when it's in session history");

test(t => {
  const frames = ["iframe", "iframe"].map(val => document.createElement(val));
  frames[1].name = "thebettername";
  document.body.append(...frames);
  t.add_cleanup(() => { frames.map(val => val.remove()) });
  const frameWs = frames.map(val => val.contentWindow),
        openee = frameWs[0].open("", "thebettername");
  assert_equals(openee, frameWs[1]);
  assert_equals(openee.opener, frameWs[0]);
  frames[0].remove();
  assert_equals(openee.opener, null);
}, "Set the opener browsing context to null when discarded (<iframe>)");

async_test(t => {
  // Initially I had one less window.open() call, but Chrome forbids window.open() on about:blank
  // from creating a new window. This works however.
  const openee = window.open(),
        thename = window.open("", "theevenbettername"),
        furtherOpenee = openee.open("", "theevenbettername");
  assert_equals(openee.opener, self);
  assert_equals(furtherOpenee.opener, openee);
  openee.onunload = t.step_func(() => {
    assert_equals(furtherOpenee.opener, openee);
    t.step_timeout(() => {
      assert_equals(furtherOpenee.opener, null);
      furtherOpenee.close();
      t.done();
    }, 0);
  });
  openee.close();
  assert_equals(furtherOpenee.opener, openee);
}, "Set the opener browsing context to null when discarded (window.open)");
