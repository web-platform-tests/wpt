// META: title=Event constants (document.createEvent)
// META: script=/dom/constants.js

var objects = [
  [document.createEvent("Event"), "Event object"],
  [document.createEvent("CustomEvent"), "CustomEvent object"],
];

testConstants(objects, [
  ["NONE", 0],
  ["CAPTURING_PHASE", 1],
  ["AT_TARGET", 2],
  ["BUBBLING_PHASE", 3],
], "eventPhase")
