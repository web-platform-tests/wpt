// META: title=crashReport property is readonly

/*
 * The crashReport property on the Window interface must be readonly.
 */
"use strict";

test(() => {
  assert_true("crashReport" in window, "The crashReport property must exist on the window object.");
  
  const originalValue = window.crashReport;
  
  assert_throws_js(TypeError, () => {
    window.crashReport = "new value";
  }, "Assigning a value to the readonly crashReport property must throw a TypeError in strict mode.");
  
  assert_equals(window.crashReport, originalValue, "The crashReport property must not be overwritten.");
}, "crashReport property is readonly");