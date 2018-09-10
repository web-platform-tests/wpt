'use strict';

function assert_inherited(property, value, expected) {
  if (expected === undefined) {
    expected = value;
  }

  test(() => {
    if (!getComputedStyle(target)[property])
      return;
    assert_not_equals(getComputedStyle(container)[property], expected);
    assert_not_equals(getComputedStyle(target)[property], expected);
    container.style[property] = value;
    assert_equals(getComputedStyle(container)[property], expected);
    assert_equals(getComputedStyle(target)[property], expected);
    target.style[property] = 'initial';
    assert_not_equals(getComputedStyle(container)[property], expected);
    assert_not_equals(getComputedStyle(target)[property], expected);
    container.style[property] = '';
    target.style[property] = '';
  }, 'Property ' + property + ' inherits');
}

function assert_not_inherited(property, value, expected) {
  if (expected === undefined) {
    expected = value;
  }

  test(() => {
    if (!getComputedStyle(target)[property])
      return;
    assert_not_equals(getComputedStyle(target)[property], expected);
    container.style[property] = value;
    assert_equals(getComputedStyle(container)[property], expected);
    assert_not_equals(getComputedStyle(target)[property], expected);
    target.style[property] = 'inherit';
    assert_equals(getComputedStyle(target)[property], expected);
    container.style[property] = '';
    target.style[property] = '';
  }, 'Property ' + property + ' does not inherit');
}
