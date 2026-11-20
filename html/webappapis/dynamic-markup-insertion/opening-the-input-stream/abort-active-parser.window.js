// META: script=/common/utils.js

promise_test(async t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  const key = token();
  t.add_cleanup(() => {
    delete window.onFrameActiveParserReady;
    fetch("resources/slow-js.py?token=" + key, { method: "POST" });
    frame.remove();
  });

  await new Promise(resolve => {
    window.onFrameActiveParserReady = resolve;
    frame.src = "resources/active-parser-frame.py?token=" + key;
  });

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  const states = [];
  doc.addEventListener("readystatechange", () => states.push(doc.readyState));

  const navBefore = win.performance.getEntriesByType("navigation")[0];
  assert_equals(navBefore.domInteractive, 0);
  assert_equals(navBefore.domComplete, 0);

  doc.open();
  assert_equals(doc.getElementById("before-open"), null, "document.open() cleared initial DOM");
  assert_array_equals(states, [], "erased readystatechange listener does not fire during document.open()");

  const navMid = win.performance.getEntriesByType("navigation")[0];
  assert_equals(navMid.domInteractive, 0, "aborting old parser in document.open() does not set domInteractive");
  assert_equals(navMid.domComplete, 0, "aborting old parser in document.open() does not set domComplete");
  doc.close();
}, "document.open() while an active parser is loading does not fire readystatechange or set domInteractive/domComplete");

promise_test(async t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  const key = token();
  t.add_cleanup(() => {
    delete window.onFrameActiveParserReady;
    fetch("resources/slow-js.py?token=" + key, { method: "POST" });
    frame.remove();
  });

  await new Promise(resolve => {
    window.onFrameActiveParserReady = resolve;
    frame.src = "resources/active-parser-frame.py?token=" + key;
  });

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  assert_equals(doc.readyState, "loading");
  assert_not_equals(doc.getElementById("before-open"), null);

  doc.open();
  assert_equals(doc.readyState, "loading");

  doc.write("<div id='from-open'>replaced</div>");
  doc.close();

  await fetch("resources/slow-js.py?token=" + key, { method: "POST" });
  await new Promise(resolve => t.step_timeout(resolve, 50));
  assert_false(Boolean(win.oldScriptRan), "pending parser-blocking script from aborted parser does not execute");
  assert_equals(doc.getElementById("after-blocked-script"), null, "discarded input stream from old parser is not parsed");
  assert_equals(doc.getElementById("from-open").textContent, "replaced");
  assert_equals(doc.readyState, "complete");
}, "document.open() aborts an active network parser after commit and discards its remaining input");

promise_test(async t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => frame.remove());

  const doc = frame.contentDocument;
  doc.open();
  doc.write("<div id='first'><span>unclosed");
  assert_equals(doc.readyState, "loading");

  const states = [];
  doc.addEventListener("readystatechange", () => states.push(doc.readyState));

  doc.open();
  assert_equals(doc.readyState, "loading");
  assert_array_equals(states, []);
  assert_equals(doc.getElementById("first"), null);

  doc.write("<div id='second'>ok</div>");
  doc.close();
  assert_not_equals(doc.readyState, "loading");
  assert_equals(doc.getElementById("second").textContent, "ok");

  await t.step_wait(() => doc.readyState === "complete", "wait for complete readiness");
}, "document.open() aborts a previous script-created parser and allows subsequent writes");
