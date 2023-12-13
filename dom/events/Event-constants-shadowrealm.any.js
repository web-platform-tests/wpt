// META: global=shadowrealm
// META: script=../constants.js

// The non-ShadowRealm version of this test is in Event-constants.html.

var objects = [
  [Event, "Event interface object"],
  [Event.prototype, "Event prototype object"],
];

testConstants(objects, [
  ["NONE", 0],
  ["CAPTURING_PHASE", 1],
  ["AT_TARGET", 2],
  ["BUBBLING_PHASE", 3]
], "eventPhase");
