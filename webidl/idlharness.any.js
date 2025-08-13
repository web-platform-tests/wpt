// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js
// META: global=window,dedicatedworker,shadowrealm-in-window

"use strict";

idl_test(
  ['webidl'],
  [],
  idl_array => {
    idl_array.add_objects({
      DOMException: ['new DOMException()',
                     'new DOMException("my message")',
                     'new DOMException("my message", "myName")',
                     'new DOMException("my message", {})',
                     'new DOMException("my message", { name: "myName" })',
                     'new DOMException("my message", { cause: "myCause" })',
                     'new DOMException("my message", { name: "myName", cause: "myCause" })']
    });
  }
);
