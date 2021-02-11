// META: script=/html/canvas/resources/canvas-tests.js
// META: script=../service-worker/resources/test-helpers.sub.js

promise_test(async t => {
  const reg = await service_worker_unregister_and_register(t, "resources/fragment-serviceworker.js", "resources/");
  t.add_cleanup(async () => await reg.unregister());
  await wait_for_state(t, reg.installing, 'activated');
  const frame = await with_iframe("resources/dummy.html");
  const canvas = frame.contentDocument.body.appendChild(document.createElement("canvas"));
  canvas.width = 100;
  canvas.height = 50;
  const ctx = canvas.getContext("2d");

  // Changing this list requires corresponding changes in resources/fragment-serviceworker.js. Note
  // that expected here is intentionally not output there in some cases.
  [
    { "input": "?1#green", "subtitle": "control" },
    { "input": "?2#green", "subtitle": "request overrides" },
    { "input": "?3", "subtitle": "response wins in case of fragment conflict" }
  ].forEach(val => {
    promise_test(async t => {
      t.add_cleanup(() => {
        ctx.clearRect(0, 0, 100, 50);
      });
      const img = frame.contentDocument.body.appendChild(document.createElement("img"));
      img.src = `/images/colors.svg${val.input}`;
      await new Promise(resolve => img.onload = resolve);
      ctx.drawImage(img, 0, 0);
      _assertGreen(ctx, 100, 50);
    }, "Forward response fragments: " + val.subtitle);
  });
}, "Forward response fragments: setup");
