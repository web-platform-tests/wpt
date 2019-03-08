// Source: https://chromium.googlesource.com/chromium/src/out/+/80d1f16/Debug/gen/chrome/test/chromedriver/chrome/js.cc#58
// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE-CHROMIUM file.

function focus(element) {
  // Focus the target element in order to send keys to it.
  // First, the currently active element is blurred, if it is different from
  // the target element. We do not want to blur an element unnecessarily,
  // because this may cause us to lose the current cursor position in the
  // element.
  // Secondly, we focus the target element.
  // Thirdly, if the target element is newly focused and is a text input, we
  // set the cursor position at the end.
  // Fourthly, we check if the new active element is the target element. If not,
  // we throw an error.
  // Additional notes:
  //   - |document.activeElement| is the currently focused element, or body if
  //     no element is focused
  //   - Even if |document.hasFocus()| returns true and the active element is
  //     the body, sometimes we still need to focus the body element for send
  //     keys to work. Not sure why
  //   - You cannot focus a descendant of a content editable node
  //   - V8 throws a TypeError when calling setSelectionRange for a non-text
  //     input, which still have setSelectionRange defined. For chrome 29+, V8
  //     throws a DOMException with code InvalidStateError.
  var doc = element.ownerDocument || element;
  var prevActiveElement = doc.activeElement;
  if (element != prevActiveElement && prevActiveElement)
    prevActiveElement.blur();
  element.focus();
  if (element != prevActiveElement && element.value &&
      element.value.length && element.setSelectionRange) {
    try {
      element.setSelectionRange(element.value.length, element.value.length);
    } catch (error) {
      if (!(error instanceof TypeError) && !(error instanceof DOMException &&
          error.code == DOMException.INVALID_STATE_ERR))
        throw error;
    }
  }

  var activeElement = doc.activeElement;
  // If the element is in a shadow DOM, then as far as the document is
  // concerned, the shadow host is the active element. We need to go through the
  // tree of shadow DOMs to check that the element we gave focus to is now
  // active.
  if (element != activeElement && !element.contains(activeElement)) {
    var shadowRoot = activeElement.shadowRoot;
    while (shadowRoot) {
      var activeElement = shadowRoot.activeElement;
      if (element == activeElement) {
        // the shadow DOM's active element is our requested element. We're good.
        break;
      }
      // The shadow DOM's active element isn't our requested element, check to
      // see if there's a nested shadow DOM.
      shadowRoot = activeElement.shadowRoot;
    }
  }
  if (element != activeElement && !element.contains(activeElement))
    throw new Error('cannot focus element');
}
