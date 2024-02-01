/* Utilities for keyboard-focused accessibility */

const KeyboardAccessibilityUtils = {

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
  },


  /*
  Tests that all elements matching selector are
  tabbable, i.e., present in the keyboard tab order.

  Ex: <button style="display: contents;"
        data-testname="button with display: contents is in keyboard tab order"
        class="ex-tabbable">

      keyboardAccessibilityUtils.verifyElementsAreTabbable(".ex-tabbable")
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
        await test_driver.send_keys(focusablePreviousElement, "\uE004"); // \uE004 is the Tab key (see WebDriver key codepoints: https://w3c.github.io/webdriver/#keyboard-actions)
        assert_equals(document.activeElement, el, "Element is tabbable");
        document.body.removeChild(focusablePreviousElement);
      }, `${testName}`);
    }
  },
};
