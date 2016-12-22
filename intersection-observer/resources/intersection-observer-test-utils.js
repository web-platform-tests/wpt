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
//     - waitForNotification(myTestFunction2)
//       - requestAnimationFrame()
//     - Verify newly-arrived IntersectionObserver notifications
//     - Modify DOM to trigger new notifications
function waitForNotification(f, description) {
  requestAnimationFrame(function() {
    setTimeout(function() {
      setTimeout(f);
    });
  });
}

function runTestCycle(f, description) {
  async_test(function(t) {
    waitForNotification(t.step_func(function() {
      f();
      t.done();
    }));
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
  if (expected.length > 0)
    assert_equals(actual.left, expected[0], description + ".left == " + expected[0]);
  if (expected.length > 1)
    assert_equals(actual.right, expected[1], description + ".right == " + expected[1]);
  if (expected.length > 2)
    assert_equals(actual.top, expected[2], description + ".top == " + expected[2]);
  if (expected.length > 3)
    assert_equals(actual.bottom, expected[3], description + ".bottom == " + expected[3]);
}

function checkEntry(entries, i, expected) {
  assert_equals(entries.length, i+1, String(i+1) + " notification(s).");
  if (expected) {
    checkRect(entries[i].boundingClientRect, expected.slice(0, 4),
              "entries[" + i + "].boundingClientRect");
    checkRect(entries[i].intersectionRect, expected.slice(4, 8),
              "entries[" + i + "].intersectionRect");
    checkRect(entries[i].rootBounds, expected.slice(8, 12),
              "entries[" + i + "].rootBounds");
  }
}

function coordinatesToClientRectJson(top, right, bottom, left) {
  return {
    top: top,
    right: right,
    bottom: bottom,
    left: left
  };
}

function clientRectToJson(rect) {
  if (!rect)
    return "null";
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left
  };
}

function entryToJson(entry) {
  return {
    boundingClientRect: clientRectToJson(entry.boundingClientRect),
    intersectionRect: clientRectToJson(entry.intersectionRect),
    rootBounds: clientRectToJson(entry.rootBounds),
    target: entry.target.id
  };
}

function checkJsonEntry(actual, expected) {
  checkRect(actual.boundingClientRect, expected.boundingClientRect, "entry.boundingClientRect");
  checkRect(actual.intersectionRect, expected.intersectionRect, "entry.intersectionRect");
  if (actual.rootBounds == "null")
    assert_equals(expected.rootBounds, "null", "rootBounds is null");
  else
    checkRect(actual.rootBounds, expected.rootBounds, "entry.rootBounds");
  assert_equals(actual.target, expected.target);
}

function checkJsonEntries(actual, expected, description) {
  test(function() {
    assert_equals(actual.length, expected.length);
    for (var i = 0; i < actual.length; i++)
      checkJsonEntry(actual[i], expected[i]);
  }, description);
}
