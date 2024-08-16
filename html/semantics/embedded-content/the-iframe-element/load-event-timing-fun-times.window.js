// These tests are assuming that the load event for no src or src=about:blank iframes fire during
// append, as is tested in load-event-timing.window.js.

test(t => {
  const container = document.body.appendChild(document.createElement("div"));
  const f1 = document.createElement("iframe");
  f1.name = "frame-1";
  const f2 = document.createElement("iframe");
  f2.name = "frame-2";
  t.add_cleanup(() => container.remove());
  const happened = [];
  f1.onload = t.step_func(() => {
    happened.push("f1 load");
    assert_equals(container.children.length, 2);
    assert_equals(window.length, 1);
    assert_not_equals(f1.contentWindow, null);
    assert_not_equals(f1.contentDocument, null);
    assert_equals(window[0], f1.contentWindow);
    assert_equals(window["frame-1"], f1.contentWindow);
    assert_equals(document["frame-1"], f1.contentWindow);
    assert_equals(f2.contentWindow, null);
    assert_equals(f2.contentDocument, null);
    assert_equals(window[1], undefined);
    assert_equals(window["frame-2"], undefined);
    assert_equals(document["frame-2"], f2);
  });
  f2.onload = t.step_func(() => happened.push("f2 load"));
  container.append(f1, f2);
  assert_array_equals(happened, ["f1 load", "f2 load"]);
}, "<iframe> elements get a nested browsing context at the same time their load event fires");

test(t => {
  const container = document.body.appendChild(document.createElement("div"));
  const f1 = document.createElement("iframe");
  f1.src = "data:,";
  const f2 = document.createElement("iframe");
  const f3 = document.createElement("iframe");
  t.add_cleanup(() => container.remove());
  const happened = [];
  f1.onload = t.step_func(() => {
     assert_array_equals(happened, ["f2 load", "append"]);
     assert_equals(f1.contentWindow, window[0]);
     assert_equals(f2.contentWindow, window[1]);
     assert_equals(f3.contentWindow, window[2]);
  });
  f2.onload = t.step_func(() => {
    assert_array_equals(happened, []);
    happened.push("f2 load");
    assert_equals(f1.contentWindow, window[0]);
    assert_equals(f3.contentDocument, null);
  });
  container.append(f1, f2, f3);
  assert_array_equals(happened, ["f2 load"]);
  happened.push("append");
}, "<iframe> elements that do not get a load event 'directly' still get a nested browsing context");
