/**
 * Reftest helper for an image whose response is still arriving.
 *
 * Takes the screenshot while the image is part-way through being delivered,
 * which is the only way to test progressive rendering: what a decoder shows
 * when it holds some whole number of layers and not the rest.
 *
 * Usage, with class="reftest-wait" on the root element:
 *
 *   <script src="resources/streaming-image-reftest.js"></script>
 *   <script>
 *   streamingImageReftest('resources/layers-2.avif?pipe=trickle(348:d30)');
 *   </script>
 *
 * The request is started from the load event rather than being an <img> in the
 * markup. The reftest runner only begins honouring reftest-wait after
 * window.onload
 * (tools/wptrunner/wptrunner/executors/test-wait.js).
 */

function streamingImageReftest(src) {
  // A second image, requested after the one under test, whose completion is
  // the signal to screenshot.
  //
  // The question this answers is "have the bytes of the layer under test been
  // delivered yet", and a barrier resource answers it causally rather than by
  // guessing at a wall-clock duration.
  //
  // It is a plain unlayered AVIF, so completing it means the image decoding
  // pipeline has taken in and finished a resource queued *after* the one under
  // test.
  //
  // It is trickled like the image under test so that both travel the same
  // wptserve pipe machinery rather than one taking a different path through
  // the server, and because trickle sets no-store, so the barrier stays a real
  // network fetch on every test instead of an instant cache hit.
  const kBarrierSrc = "/images/green.avif?pipe=trickle(d0)";

  // Bytes having arrived is not the same as pixels having been painted, so
  // allow a paint after the barrier completes. The runner waits two more
  // frames itself before capturing.
  const kPaintFrames = 2;

  function afterFrames(count, callback) {
    if (count <= 0) {
      callback();
      return;
    }
    requestAnimationFrame(() => afterFrames(count - 1, callback));
  }

  function releaseScreenshot() {
    document.documentElement.classList.remove("reftest-wait");
  }

  addEventListener("load", () => {
    const image = document.createElement("img");
    // Nothing further to wait for: an implementation that rejects the partial
    // response reports as a failed comparison against the expected colour,
    // rather than as a timeout.
    image.addEventListener("error", releaseScreenshot);
    image.src = src;
    document.body.appendChild(image);

    // A frame later, and at low priority, so the request for the image under
    // test is issued first.
    requestAnimationFrame(() => {
      const barrier = document.createElement("img");
      // Invisible, and out of flow so it cannot shift the image under test:
      // the references are a plain in-flow <img>, and an inline barrier would
      // still contribute to the line box at opacity 0.
      barrier.style.cssText = "position: absolute; opacity: 0";
      barrier.setAttribute("fetchpriority", "low");
      // Either outcome is a usable signal, and waiting for neither would hang.
      barrier.addEventListener("load", () =>
        afterFrames(kPaintFrames, releaseScreenshot),
      );
      barrier.addEventListener("error", () =>
        afterFrames(kPaintFrames, releaseScreenshot),
      );
      barrier.src = kBarrierSrc;
      document.body.appendChild(barrier);
    });
  });
}
