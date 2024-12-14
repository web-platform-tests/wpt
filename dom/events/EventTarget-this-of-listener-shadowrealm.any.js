// META: global=shadowrealm

// The non-ShadowRealm version of this test is in
// EventTarget-this-of-listener.html.

"use strict";

test(() => {
  const nodes = [
    globalThis,
    new EventTarget(),
  ];

  let callCount = 0;
  for (const node of nodes) {
    node.addEventListener("someevent", function () {
      ++callCount;
      assert_equals(this, node);
    });

    node.dispatchEvent(new CustomEvent("someevent"));
  }

  assert_equals(callCount, nodes.length);
}, "the this value inside the event listener callback should be the node");

test(() => {
  const nodes = [
    globalThis,
    new EventTarget(),
  ];

  let callCount = 0;
  for (const node of nodes) {
    const handler = {
      handleEvent() {
        ++callCount;
        assert_equals(this, handler);
      }
    };

    node.addEventListener("someevent", handler);

    node.dispatchEvent(new CustomEvent("someevent"));
  }

  assert_equals(callCount, nodes.length);
}, "the this value inside the event listener object handleEvent should be the object");

test(() => {
  const nodes = [
    globalThis,
    new EventTarget(),
  ];

  let callCount = 0;
  for (const node of nodes) {
    const handler = {
      handleEvent() {
        assert_unreached("should not call the old handleEvent method");
      }
    };

    node.addEventListener("someevent", handler);
    handler.handleEvent = function () {
      ++callCount;
      assert_equals(this, handler);
    };

    node.dispatchEvent(new CustomEvent("someevent"));
  }

  assert_equals(callCount, nodes.length);
}, "dispatchEvent should invoke the current handleEvent method of the object");

test(() => {
  const nodes = [
    globalThis,
    new EventTarget(),
  ];

  let callCount = 0;
  for (const node of nodes) {
    const handler = {};

    node.addEventListener("someevent", handler);
    handler.handleEvent = function () {
      ++callCount;
      assert_equals(this, handler);
    };

    node.dispatchEvent(new CustomEvent("someevent"));
  }

  assert_equals(callCount, nodes.length);
}, "addEventListener should not require handleEvent to be defined on object listeners");

test(() => {
  const nodes = [
    globalThis,
    new EventTarget(),
  ];

  let callCount = 0;
  for (const node of nodes) {
    function handler() {
      ++callCount;
      assert_equals(this, node);
    }

    handler.handleEvent = () => {
      assert_unreached("should not call the handleEvent method on a function");
    };

    node.addEventListener("someevent", handler);

    node.dispatchEvent(new CustomEvent("someevent"));
  }

  assert_equals(callCount, nodes.length);
}, "handleEvent properties added to a function before addEventListener are not reached");

test(() => {
  const nodes = [
    globalThis,
    new EventTarget(),
  ];

  let callCount = 0;
  for (const node of nodes) {
    function handler() {
      ++callCount;
      assert_equals(this, node);
    }

    node.addEventListener("someevent", handler);

    handler.handleEvent = () => {
      assert_unreached("should not call the handleEvent method on a function");
    };

    node.dispatchEvent(new CustomEvent("someevent"));
  }

  assert_equals(callCount, nodes.length);
}, "handleEvent properties added to a function after addEventListener are not reached");
