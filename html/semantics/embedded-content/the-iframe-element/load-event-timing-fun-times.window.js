// These tests are assuming that the load event for no src or src=about:blank iframes fire during
// append, as is tested in load-event-timing.window.js.

test(t => {
  const container = document.body.appendChild(document.createElement("div"));
  const f1 = document.createElement("iframe");
  const f2 = document.createElement("iframe");
  t.add_cleanup(() => container.remove());
  const happened = [];
  f1.onload = t.step_func(() => {
    happened.push("f1 load");
    assert_equals(container.children.length, 2);
  });
  f2.onload = t.step_func(() => happened.push("f2 load"));
  container.append(f1, f2);
  assert_array_equals(happened, ["f1 load", "f2 load"]);
}, "");
