---
layout: page
title: testdriver.js Automation
order: 8.5
---

testdriver.js provides a means to automate tests that cannot be
written purely using web platform APIs.

It is currently supported only for [testharness.js][testharness]
tests.

## API

testdriver.js exposes its API through the `test_driver` variable in
the global scope.

NB: presently, testdriver.js only works in the top-level test browsing
context (and not therefore in any frame or window opened from it).

### `test_driver.click(element)`
#### `element: a DOM Element object`

This function causes a click to occur on the target element (an
`Element` object), potentially scrolling the document to make it
possible to click it. It returns a `Promise` that resolves after the
click has occured or rejects if the element cannot be clicked (for
example, it is obscured by an element on top of it).

Note that if the element to be clicked does not have a unique ID, the
document must not have any DOM mutations made between the function
being called and the promise settling.

### `test_driver.send_keys(element, keys)`
#### `element: a DOM Element object`
#### `keys: string to send to the element`

This function causes the string `keys` to be send to the target
element (an `Element` object), potentially scrolling the document to
make it possible to send keys. It returns a `Promise` that resolves
after the keys have been send or rejects if the keys cannot be sent
to the element.

Note that if the element that's keys need to be send to does not have
a unique ID, the document must not have any DOM mutations made
between the function being called and the promise settling.

### `testdriver.action_chain(chain)`
 - `chain` <[Array]<[Object]>> An array of actions to chain
  - `action_object` <[Object]> A single action
    - `type` <[string]> the type of action, one of 'click', 'click_and_hold', 'context_click', 'double_click', 'drag_and_drop', 'drag_and_drop_by_offset', 'key_down', 'key_up', 'move_by_offset',
    'move_to_element', 'move_to_element_with_offset', 'pause', 'perform', 'release', 'reset_actions', 'send_keys', 'send_keys_to_element'
    - `args` <[Object]> a list of arguments to pass for the current action
     - `type` <[string]> the type of arg
     - `arg` <[Object]> the argument to the action

This function causes a sequence of actions to occur which can be any of 'click', 'click_and_hold', 'context_click', 'double_click', 'drag_and_drop', 'drag_and_drop_by_offset', 'key_down', 'key_up', 'move_by_offset', 'move_to_element', 'move_to_element_with_offset', 'pause', 'perform', 'release', 'reset_actions', 'send_keys', 'send_keys_to_element'.

Note that if any of the elements passed in as arguments do not have a unique ID, the
document must not have any DOM mutations made between the function
being called and the promise settling.


[testharness]: {{ site.baseurl }}{% link _writing-tests/testharness.md %}
