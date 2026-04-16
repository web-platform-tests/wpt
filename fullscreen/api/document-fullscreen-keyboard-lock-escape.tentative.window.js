// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-actions.js
// META: script=/resources/testdriver-vendor.js
// META: timeout=long

promise_test(async () => {
  await test_driver.bless("requestFullscreen", () => document.body.requestFullscreen({ keyboardLock: "browser" }));
  assert_equals(document.fullscreenElement, document.body, "fullscreen should activate");

  let { promise: fullscreenExitPromise, resolve } = Promise.withResolvers();
  document.addEventListener("fullscreenchange", resolve, { once: true });

  // Press Escape for 5 seconds
  // Holding the key makes it repeat, so do the same here
  let actions = new test_driver.Actions()
    .keyDown("\uE00C")
    .addTick(1000)
    .keyDown("\uE00C")
    .addTick(1000)
    .keyDown("\uE00C")
    .addTick(1000)
    .keyDown("\uE00C")
    .addTick(1000)
    .keyDown("\uE00C")
    .addTick(1000)
    .keyDown("\uE00C")
    .keyUp("\uE00C")
  await actions.send();

  await fullscreenExitPromise;
  assert_equals(document.fullscreenElement, null, "fullscreen should deactivate");
}, "Holding Escape should cause fullscreen exit");
