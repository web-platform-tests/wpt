async_test(t => {
  const frame = document.createElement("iframe");
  t.add_cleanup(() => frame.remove());
  let happened = []
  frame.onload = t.step_func(() => happened.push("load"));
  document.body.append(frame);
  happened.push("append");
  // Use timeout for assert in case there's multiple load events erroneously
  t.step_timeout(() => {
    assert_array_equals(happened, ["load", "append"]);
    t.done();
  }, 500);
}, "<iframe> without src and load event");

async_test(t => {
  const frame = document.createElement("iframe");
  t.add_cleanup(() => frame.remove());
  let happened = []
  frame.onload = t.step_func(() => happened.push("load"));
  frame.src = "about:blank";
  document.body.append(frame);
  happened.push("append");
  // Use timeout for assert in case there's multiple load events erroneously
  t.step_timeout(() => {
    assert_array_equals(happened, ["load", "append"]);
    t.done();
  }, 500);
}, "<iframe> with about:blank src and load event");

async_test(t => {
  const frame = document.createElement("iframe");
  t.add_cleanup(() => frame.remove());
  let happened = false;
  frame.onload = t.step_func_done(() => assert_true(happened));
  frame.src = URL.createObjectURL(new Blob([""], { type: "text/html" }));
  document.body.append(frame);
  happened = true;
}, "<iframe> with blob: URL src and load event");

async_test(t => {
  const frame = document.createElement("iframe");
  t.add_cleanup(() => frame.remove());
  let happened = false;
  frame.onload = t.step_func_done(() => assert_true(happened));
  frame.src = "data:text/html,";
  document.body.append(frame);
  happened = true;
}, "<iframe> with data: URL src and load event");

async_test(t => {
  const frame = document.createElement("iframe");
  t.add_cleanup(() => frame.remove());
  let happened = false;
  frame.onload = t.step_func_done(() => assert_true(happened));
  frame.srcdoc = "";
  document.body.append(frame);
  happened = true;
}, "<iframe> with srcdoc and load event");
