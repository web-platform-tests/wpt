"use strict";

// This helper ensures that when the selection direction is reset, it always is reset to the same value consistently
// (which must be one of either "none" or "forward"). This helps catch bugs like one observed in Chrome, where textareas
// reset to "none" but inputs reset to "forward".
let observedResetSelectionDirection;
window.assertSelectionDirectionIsReset = element => {
  if (!observedResetSelectionDirection) {
    assert_in_array(element.selectionDirection, ["none", "forward"],
      "selectionDirection must be set to either none or forward");
    observedResetSelectionDirection = element.selectionDirection;
  } else {
    assert_equals(element.selectionDirection, observedResetSelectionDirection,
      `selectionDirection must be reset to ${observedResetSelectionDirection} (which was previously observed to be ` +
      `the value after resetting the selection direction)`);
  }
};
