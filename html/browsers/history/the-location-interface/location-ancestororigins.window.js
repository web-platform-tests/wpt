test(() => {
  assert_equals(location.ancestorOrigins.length, 0)
}, "location.ancestorOrigins basic check");

async_test(t => {
  const frame = document.createElement("iframe"),
        rp = document.createElement("meta");
  frame.onload = t.step_func_done(() => {
    const ancestorOrigins = frame.contentWindow.location.ancestorOrigins;
    assert_equals(ancestorOrigins[0], self.origin);
    assert_equals(ancestorOrigins.length, 1);

    rp.name = "referrer";
    rp.content = "no-referrer";
    document.head.appendChild(rp);
    assert_equals(self[0].location.ancestorOrigins, ancestorOrigins);
    assert_equals(ancestorOrigins[0], self.origin);
    assert_equals(ancestorOrigins.length, 1);
    rp.remove();

    frame.referrerPolicy = "no-referrer";
    assert_equals(self[0].location.ancestorOrigins, ancestorOrigins);
    assert_equals(ancestorOrigins[0], self.origin);
    assert_equals(ancestorOrigins.length, 1);

    frame.remove();
  })
  frame.src = "/common/blank.html";
  document.body.appendChild(frame);
}, "location.ancestorOrigins cannot be masked by a dynamic referrer policy");

async_test(t => {
  const frame = document.createElement("iframe");
  frame.onload = t.step_func_done(() => {
    const ancestorOrigins = frame.contentWindow.location.ancestorOrigins;
    assert_equals(ancestorOrigins[0], "null");
    assert_equals(ancestorOrigins.length, 1);
    frame.remove();
  })
  frame.src = "/common/blank.html";
  frame.referrerPolicy = "no-referrer";
  document.body.appendChild(frame);
}, "location.ancestorOrigins can be masked by a predetermined referrer policy");

async_test(t => {
  const frame = document.createElement("iframe");
  t.add_cleanup(() => frame.remove());
  frame.src = new URL("resources/ancestororigins-embed.py?id=123&iframe=|./ancestororigins-embed.py%3Fid=1234", location.href.replace("://", "://天気の良い日.")).href;
  document.body.appendChild(frame);

  let almostDone = false;
  function localDone() {
    if(almostDone) {
      t.done();
    }
    almostDone = true;
  }

  self.onmessage = t.step_func(e => {
    if(e.data.id === 123) {
      assert_array_equals(e.data.output, [location.origin]);
      localDone();
    } else if(e.data.id === 1234) {
      assert_array_equals(e.data.output, [location.origin.replace("://", "://xn--n8j6ds53lwwkrqhv28a."), location.origin]);
      localDone();
    } else {
      assert_unreached();
    }
  });
}, "location.ancestorOrigins and IDNA");
