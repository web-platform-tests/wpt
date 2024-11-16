// META: title=Event constants
// META: script=/dom/constants.js

var objects;
setup(function() {
  objects = [
    [Event, "Event interface object"],
    [Event.prototype, "Event prototype object"],
    [document.createEvent("Event"), "Event object"],
    [document.createEvent("CustomEvent"), "CustomEvent object"]
  ]
})

testConstants(objects, [
  ["NONE", 0],
  ["CAPTURING_PHASE", 1],
  ["AT_TARGET", 2],
  ["BUBBLING_PHASE", 3]
], "eventPhase")
