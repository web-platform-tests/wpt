/* Utilities for keyboard testing */

const keys = {
  // See WebDriver key codepoints: https://w3c.github.io/webdriver/#keyboard-actions
  "LeftShiftAndTab": "\uE008" + "\uE004", // Left Shift = \uE008 and Right Shift = \uE050 however, they should be indistinguishable
  "Tab": "\uE004",
};

const keyboardUtils = {

  /*
  Tests that all elements matching selector can
  receive focus (and related) events.

  Ex: <div role="button"
        tabindex="0"
        data-testname="div with role button and tabindex=0 is focusable"
        class="ex-focusable">
      </div>

      keyboardUtils.verifyElementsAreFocusable(".ex-focusable")
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
  },

  /*
  Tests that all elements matching selector
  are currently focused at the point of test execution.

  Ex: <button
        data-testname="button is focused after associated <dialog> escape key dismissal"
        class="ex-focused">
      </button>

      keyboardUtils.verifyElementIsFocused(".ex-focused")
  */
  verifyElementIsFocused: function(selector) {
    const els = document.querySelectorAll(selector);
    if (!els.length) {
      throw `Selector passed in verifyElementIsFocused("${selector}") should match at least one element.`;
    }
    for (const el of els) {
      let testName = el.getAttribute("data-testname");
      test(() => {
        assert_equals(document.activeElement, el, "Element is currently focused");
      }, `${testName}`);
    }
  },


  /*
  Tests that all elements matching selector are
  tabbable, i.e., present in the keyboard tab order.

  Ex: <button style="display: contents;"
        data-testname="button with display: contents is in keyboard tab order"
        class="ex-tabbable">
      </button>

      keyboardUtils.verifyElementsAreTabbable(".ex-tabbable")
  */
  verifyElementsAreTabbable: function(selector) {
    const els = document.querySelectorAll(selector);
    const focusablePreviousElement = document.createElement("a");
    focusablePreviousElement.setAttribute("href", "#");
    focusablePreviousElement.appendChild(document.createTextNode("a focusable link"));
    if (!els.length) {
      throw `Selector passed in verifyElementsAreTabbable("${selector}") should match at least one element.`;
    }
    for (const el of els) {
      let testName = el.getAttribute("data-testname");
      promise_test(async t => {
        el.parentNode.insertBefore(focusablePreviousElement, el);
        focusablePreviousElement.focus();
        assert_equals(document.activeElement, focusablePreviousElement, "precondition: el's previous focusable element is currently focused");
        assert_not_equals(document.activeElement, el, "precondition: el is not focused");
        await test_driver.send_keys(focusablePreviousElement, keys.Tab);
        assert_equals(document.activeElement, el, "Element is tabbable");
        document.body.removeChild(focusablePreviousElement);
      }, `${testName}`);
    }
  },

  /*
  Tests that all elements matching selector are
  tabbable and do not create a focus trap.

  Ex: <button style="display: flex;"
        data-testname="button with display: flex does not cause keyboard trap"
        class="ex-no-keyboard-trap">
      </button>

      keyboardUtils.verifyElementsDoNotCauseKeyboardTrap(".ex-no-keyboard-trap")
  */
  verifyElementsDoNotCauseKeyboardTrap: function(selector) {
    const els = document.querySelectorAll(selector);
    const focusablePreviousElement = document.createElement("a");
    focusablePreviousElement.setAttribute("href", "#");
    focusablePreviousElement.appendChild(document.createTextNode("a focusable link"));
    if (!els.length) {
      throw `Selector passed in verifyElementsDoNotCauseKeyboardTrap("${selector}") should match at least one element.`;
    }
    for (const el of els) {
      let testName = el.getAttribute("data-testname");
      promise_test(async t => {
        el.focus();
        assert_equals(document.activeElement, el, "precondition: el is currently focused");
        el.parentNode.insertBefore(focusablePreviousElement, el);
        await test_driver.send_keys(el, keys.LeftShiftAndTab);
        assert_equals(document.activeElement, focusablePreviousElement, "precondition: el's previous focusable element is currently focused");
        assert_not_equals(document.activeElement, el, "precondition: el is not focused");
        await test_driver.send_keys(focusablePreviousElement, keys.Tab);
        assert_equals(document.activeElement, el, "el has successfully lost and received focus, and is now focused");
        document.body.removeChild(focusablePreviousElement);
      }, `${testName}`);
    }
  },
};