// Here's how waitForNotification works:
//
// - myTestFunction0()
//   - waitForNotification(myTestFunction1)
//     - requestAnimationFrame()
//   - Modify DOM in a way that should trigger an IntersectionObserver callback.
// - BeginFrame
//   - requestAnimationFrame handler runs
//     - First setTimeout()
//   - Style, layout, paint
//   - IntersectionObserver generates new notifications
//     - Posts a task to deliver notifications
// - First setTimeout handler runs
//   - Second setTimeout()
// - Task to deliver IntersectionObserver notifications runs
//   - IntersectionObserver callbacks run
// - Second setTimeout handler runs
//   - myTestFunction1()
//     - [optional] waitForNotification(myTestFunction2)
//       - requestAnimationFrame()
//     - Verify newly-arrived IntersectionObserver notifications
//     - [optional] Modify DOM to trigger new notifications
function waitForNotification(f) {
  requestAnimationFrame(function() {
    setTimeout(function() { setTimeout(f); });
  });
}

// The timing of when runTestCycle is called is important.  It should be
// called:
//
//   - Before or during the window load event, or
//   - Inside of a prior runTestCycle callback, *before* any assert_* methods
//     are called.
//
// Following these rules will ensure that the test suite will not abort before
// all test steps have run.
function runTestCycle(f, description) {
  async_test(function(t) {
    waitForNotification(t.step_func_done(f));
  }, description);
}

// Root bounds for a root with an overflow clip as defined by:
//   http://wicg.github.io/IntersectionObserver/#intersectionobserver-root-intersection-rectangle
function contentBounds(root) {
  var left = root.offsetLeft + root.clientLeft;
  var right = left + root.clientWidth;
  var top = root.offsetTop + root.clientTop;
  var bottom = top + root.clientHeight;
  return [left, right, top, bottom];
}

// Root bounds for a root without an overflow clip as defined by:
//   http://wicg.github.io/IntersectionObserver/#intersectionobserver-root-intersection-rectangle
function borderBoxBounds(root) {
  var left = root.offsetLeft;
  var right = left + root.offsetWidth;
  var top = root.offsetTop;
  var bottom = top + root.offsetHeight;
  return [left, right, top, bottom];
}

function rectArea(rect) {
  return (rect.left - rect.right) * (rect.bottom - rect.top);
}

function checkRect(actual, expected, description) {
  if (!expected.length)
    return;
  assert_equals(actual.left, expected[0], description + '.left');
  assert_equals(actual.right, expected[1], description + '.right');
  assert_equals(actual.top, expected[2], description + '.top');
  assert_equals(actual.bottom, expected[3], description + '.bottom');
}

function checkLastEntry(entries, i, expected) {
  assert_equals(entries.length, i + 1, 'entries.length');
  if (expected) {
    checkRect(
        entries[i].boundingClientRect, expected.slice(0, 4),
        'entries[' + i + '].boundingClientRect');
    checkRect(
        entries[i].intersectionRect, expected.slice(4, 8),
        'entries[' + i + '].intersectionRect');
    checkRect(
        entries[i].rootBounds, expected.slice(8, 12),
        'entries[' + i + '].rootBounds');
    if (expected.length > 12) {
      assert_equals(
          entries[i].isIntersecting, expected[12],
          'entries[' + i + '].isIntersecting');
    }
  }
}

function checkJsonEntry(actual, expected) {
  checkRect(
      actual.boundingClientRect, expected.boundingClientRect,
      'entry.boundingClientRect');
  checkRect(
      actual.intersectionRect, expected.intersectionRect,
      'entry.intersectionRect');
  if (actual.rootBounds == 'null')
    assert_equals(expected.rootBounds, 'null', 'rootBounds is null');
  else
    checkRect(actual.rootBounds, expected.rootBounds, 'entry.rootBounds');
  assert_equals(actual.target, expected.target);
}

function checkJsonEntries(actual, expected, description) {
  test(function() {
    assert_equals(actual.length, expected.length);
    for (var i = 0; i < actual.length; i++)
      checkJsonEntry(actual[i], expected[i]);
  }, description);
}
