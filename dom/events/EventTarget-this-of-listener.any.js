// META: title=EventTarget listeners this value (DOM nodes)

// Author: Domenic Denicola <d@domenic.me>
// https://dom.spec.whatwg.org/#concept-event-listener-invoke

// There is another version of this test using DOM nodes as event targets, in
// EventTarget-this-of-listener-dom.window.js.

"use strict";

test(() => {
  const targets = [
    globalThis,
    new EventTarget(),
  ];

  let callCount = 0;
  for (const target of targets) {
    target.addEventListener("someevent", function () {
      ++callCount;
      assert_equals(this, target);
    });

    target.dispatchEvent(new CustomEvent("someevent"));
  }

  assert_equals(callCount, targets.length);
}, "the this value inside the event listener callback should be the node");

test(() => {
  const targets = [
    globalThis,
    new EventTarget(),
  ];

  let callCount = 0;
  for (const target of targets) {
    const handler = {
      handleEvent() {
        ++callCount;
        assert_equals(this, handler);
      }
    };

    target.addEventListener("someevent", handler);

    target.dispatchEvent(new CustomEvent("someevent"));
  }

  assert_equals(callCount, targets.length);
}, "the this value inside the event listener object handleEvent should be the object");

test(() => {
  const targets = [
    globalThis,
    new EventTarget(),
  ];

  let callCount = 0;
  for (const target of targets) {
    const handler = {
      handleEvent() {
        assert_unreached("should not call the old handleEvent method");
      }
    };

    target.addEventListener("someevent", handler);
    handler.handleEvent = function () {
      ++callCount;
      assert_equals(this, handler);
    };

    target.dispatchEvent(new CustomEvent("someevent"));
  }

  assert_equals(callCount, targets.length);
}, "dispatchEvent should invoke the current handleEvent method of the object");

test(() => {
  const targets = [
    globalThis,
    new EventTarget(),
  ];

  let callCount = 0;
  for (const target of targets) {
    const handler = {};

    target.addEventListener("someevent", handler);
    handler.handleEvent = function () {
      ++callCount;
      assert_equals(this, handler);
    };

    target.dispatchEvent(new CustomEvent("someevent"));
  }

  assert_equals(callCount, targets.length);
}, "addEventListener should not require handleEvent to be defined on object listeners");

test(() => {
  const targets = [
    globalThis,
    new EventTarget(),
  ];

  let callCount = 0;
  for (const target of targets) {
    function handler() {
      ++callCount;
      assert_equals(this, target);
    }

    handler.handleEvent = () => {
      assert_unreached("should not call the handleEvent method on a function");
    };

    target.addEventListener("someevent", handler);

    target.dispatchEvent(new CustomEvent("someevent"));
  }

  assert_equals(callCount, targets.length);
}, "handleEvent properties added to a function before addEventListener are not reached");

test(() => {
  const targets = [
    globalThis,
    new EventTarget(),
  ];

  let callCount = 0;
  for (const target of targets) {
    function handler() {
      ++callCount;
      assert_equals(this, target);
    }

    target.addEventListener("someevent", handler);

    handler.handleEvent = () => {
      assert_unreached("should not call the handleEvent method on a function");
    };

    target.dispatchEvent(new CustomEvent("someevent"));
  }

  assert_equals(callCount, targets.length);
}, "handleEvent properties added to a function after addEventListener are not reached");
