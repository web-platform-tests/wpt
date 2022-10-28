// META: script=../resources/helpers.js
// META: title=javascript: URL navigation to a string must create a document whose referrer is the navigation initiator

promise_test(async (t) => {
  const w = await openWindow("/common/blank.html", t);

  w.location.href = `javascript:'a string<script>opener.postMessage(document.referrer, "*");</script>'`;

  const referrer = await waitForMessage(w);

  assert_equals(referrer, location.href);
}, "default referrer policy");

promise_test(async (t) => {
  const meta = document.createElement("meta");
  meta.name = "referrer";
  meta.content = "origin";
  t.add_cleanup(() => meta.remove());
  document.head.append(meta);

  const w = await openWindow("/common/blank.html", t);

  w.location.href = `javascript:'a string<script>opener.postMessage(document.referrer, "*");</script>'`;

  const referrer = await waitForMessage(w);

  assert_equals(referrer, self.origin + "/");
}, "origin referrer policy");

promise_test(async (t) => {
  const meta = document.createElement("meta");
  meta.name = "referrer";
  meta.content = "no-referrer";
  t.add_cleanup(() => meta.remove());
  document.head.append(meta);

  const w = await openWindow("/common/blank.html", t);

  w.location.href = `javascript:'a string<script>opener.postMessage(document.referrer, "*");</script>'`;

  const referrer = await waitForMessage(w);

  assert_equals(referrer, "");
}, "no-referrer referrer policy");
