// META: script=/html/canvas/resources/canvas-tests.js
// META: script=../service-worker/resources/test-helpers.sub.js

promise_test(async t => {
  const reg = await service_worker_unregister_and_register(t, "resources/fragment-serviceworker.js", "resources/");
  // Not add_cleanup as we want this to run after all tests
  add_completion_callback(async () => await reg.unregister());
  await wait_for_state(t, reg.installing, 'activated');
  const frame = await with_iframe("resources/dummy.html");
  const canvas = frame.contentDocument.body.appendChild(document.createElement("canvas"));
  canvas.width = 100;
  canvas.height = 50;
  const ctx = canvas.getContext("2d");

  // Changing this list requires corresponding changes in resources/fragment-serviceworker.js
  [
    { input: "?1#green", subtitle: "control" },
    { input: "?2#green", subtitle: "request overrides" },
    { input: "?3", subtitle: "request overrides when null too", color: [0, 0, 0, 0] },
    { input: "?4#red", subtitle: "request does not override with syntehtic redirects to non-null fragments" },
    { input: "?5green", subtitle: "request does override with syntehtic redirect to null fragment" }
  ].forEach(({ input, subtitle, color: [red, green, blue, alpha] = [0, 255, 0, 255] }) => {
    promise_test(async t => {
      t.add_cleanup(() => {
        ctx.clearRect(0, 0, 100, 50);
      });
      const img = frame.contentDocument.body.appendChild(document.createElement("img"));
      img.src = `/images/colors.svg${input}`;
      await new Promise(resolve => img.onload = resolve);
      ctx.drawImage(img, 0, 0);
      _assertPixelApprox(canvas, 40, 40, red, green, blue, alpha, undefined, undefined, 4);
    }, "Forward response fragments: " + subtitle);
  });

}, "Forward response fragments: setup");
