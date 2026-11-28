/**
 * Shared steps for tests that change an image after its first paint, but
 * before the paint timing entries of that paint are reported.
 *
 * The page must contain exactly one contentful element: an <img id="target">
 * that starts with `visibility: hidden`. Then the reveal frame is the first
 * contentful paint, and its paint timing info also owns the image's
 * LargestContentfulPaint entry. Mark paint timing creates both entries from the
 * same paint timing info, so the final LCP renderTime must equal the FCP
 * startTime.
 *
 * The test queues a task from the reveal frame's animation frame callbacks.
 * That task blocks the main thread for `busyMs`, then runs `mutate`. In engines
 * that report paint timing in a later task (after the frame is presented), the
 * mutation runs between the paint and the report. In engines that report
 * during the rendering update, or that render the reveal only after the task,
 * the mutation runs after the report, and the test still holds.
 *
 * @param {function(HTMLImageElement): void} mutate Changes the image.
 * @param {string} description The test name.
 * @param {number=} busyMs The duration of the task before the mutation.
 */
function test_mutation_before_report(mutate, description, busyMs = 100) {
  setup({hide_test_state: true});
  promise_test(async t => {
    assert_implements(window.LargestContentfulPaint,
        'LargestContentfulPaint is not implemented');
    assert_implements(window.PerformancePaintTiming,
        'PerformancePaintTiming is not implemented');

    const img = document.getElementById('target');
    const url = img.src;
    await img.decode();

    await new Promise(resolve => requestAnimationFrame(t.step_func(() => {
      img.style.visibility = 'visible';
      t.step_timeout(() => {
        const end = performance.now() + busyMs;
        while (performance.now() < end) {}
        mutate(img);
        resolve();
      }, 0);
    })));

    // Give a late entry for a second paint of the image time to arrive.
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => t.step_timeout(resolve, 200));

    const fcp = await new Promise(resolve => new PerformanceObserver(
        (list, observer) => {
          const entry = list.getEntriesByName('first-contentful-paint')[0];
          if (entry) {
            observer.disconnect();
            resolve(entry);
          }
        }).observe({type: 'paint', buffered: true}));
    const lcpEntries = await new Promise(resolve => new PerformanceObserver(
        (list, observer) => {
          observer.disconnect();
          resolve(list.getEntries());
        }).observe({type: 'largest-contentful-paint', buffered: true}));

    const last = lcpEntries[lcpEntries.length - 1];
    assert_equals(last.url, url, 'The image is the largest contentful paint.');
    assert_equals(last.renderTime, fcp.startTime,
        'The LCP renderTime is the first paint of the image, which is the FCP.');
    assert_equals(lcpEntries.filter(e => e.url === url).length, 1,
        'The image has exactly one LCP entry.');
  }, description);
}
