// META: title=Event constants
// META: script=/dom/constants.js

// There is another version of this test depending on document.createEvent(), in
// Event-constants-createEvent.window.js.

var objects = [
  [Event, "Event interface object"],
  [Event.prototype, "Event prototype object"],
];

testConstants(objects, [
  ["NONE", 0],
  ["CAPTURING_PHASE", 1],
  ["AT_TARGET", 2],
  ["BUBBLING_PHASE", 3],
], "eventPhase");
