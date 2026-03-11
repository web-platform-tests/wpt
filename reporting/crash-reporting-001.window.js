// META: title=Window interface has crashReport property

/*
 * The Window interface must have a crashReport property.
 */

test(() => {
  assert_true('crashReport' in window, "Assert that 'crashReport' in window is true.");
}, "Window interface has crashReport property");