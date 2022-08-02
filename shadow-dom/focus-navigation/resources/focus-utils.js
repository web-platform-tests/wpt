'use strict';

function innermostActiveElement(element) {
  element = element || document.activeElement;
  if (isIFrameElement(element)) {
    if (element.contentDocument.activeElement)
      return innermostActiveElement(element.contentDocument.activeElement);
    return element;
  }
  if (isShadowHost(element)) {
    let shadowRoot = internals.shadowRoot(element);
    if (shadowRoot) {
      if (shadowRoot.activeElement)
        return innermostActiveElement(shadowRoot.activeElement);
    }
  }
  return element;
}

function isInnermostActiveElement(path) {
  const element = getNodeInComposedTree(path);
  if (!element)
    return false;
  return element === innermostActiveElement();
}

async function shouldNavigateFocus(from, to, direction) {
  const fromElement = getNodeInComposedTree(from);
  if (!fromElement)
    return false;

  fromElement.focus();
  if (!isInnermostActiveElement(from))
    return false;

  if (direction == 'forward')
    await navigateFocusForward();
  else
    await navigateFocusBackward();

  return true;
}

async function navigateFocusForward() {
  return test_driver.Actions()
    .keyDown('\uE004')
    .keyUp('\uE004')
    .send();
}

async function navigateFocusBackward() {
  return test_driver.Actions()
    .keyDown('\uE050')
    .keyDown('\uE004')
    .keyUp('\uE004')
    .keyUp('\uE050')
    .send();
}

async function assert_focus_navigation(from, to, direction) {
  const result = await shouldNavigateFocus(from, to, direction);
  assert_true(result, 'Failed to focus ' + from);
  const message =
      'Focus should move ' + direction + ' from ' + from + ' to ' + to;
  var toElement = getNodeInComposedTree(to);
  assert_equals(innermostActiveElement(), toElement, message);
}

async function assert_focus_navigation_forward(elements) {
  assert_true(
      elements.length >= 2,
      'length of elements should be greater than or equal to 2.');
  for (var i = 0; i + 1 < elements.length; ++i)
    await assert_focus_navigation(elements[i], elements[i + 1], 'forward');
}

async function assert_focus_navigation_backward(elements) {
  assert_true(
      elements.length >= 2,
      'length of elements should be greater than or equal to 2.');
  for (var i = 0; i + 1 < elements.length; ++i)
    await assert_focus_navigation(elements[i], elements[i + 1], 'backward');
}
