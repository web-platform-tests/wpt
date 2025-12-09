// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

idl_test(
  [],
  ["html", "wai-aria", "dom", "cssom", "touch-events", "uievents", "performance-timeline"],
  (idl_array) => {
    idl_array.add_objects({
      Origin: ["new Origin()"],
    });
  });

