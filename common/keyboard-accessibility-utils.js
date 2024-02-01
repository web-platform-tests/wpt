/* Utilities for keyboard-focused accessibility */

const keyboardAccessibilityUtils = {

  /*
  Tests that all elements matching selector can
  receive focus (and related) events.

    Ex: <div role="button"
            tabindex="0"
            data-testname="div with role button and tabindex is focusable"
            class="ex">

        keyboardAccessibilityUtils.verifyElementsAreFocusable(".ex-focusable")
  */
  verifyElementsAreFocusable: function(selector) {
    const els = document.querySelectorAll(selector);
        if (!els.length) {
            throw `Selector passed in verifyElementsAreFocusable("${selector}") should match at least one element.`;
        }
        for (const el of els) {
            let testName = el.getAttribute("data-testname");
            test(() => {
                el.focus();
                assert_equals(document.activeElement, el, "Element is focusable with element.focus()");
              }, `${testName}`);
        }
    }
};
