// META: global=window,worker
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

promise_test(async () => {
  const idl_array = new IdlArray();
  const idl = await fetch("/interfaces/user-timing.idl").then(r => r.text());
  const hrtime = await fetch("/interfaces/hr-time.idl").then(r => r.text());
  const dom = await fetch("/interfaces/dom.idl").then(r => r.text());

  idl_array.add_idls(idl);
  idl_array.add_dependency_idls(hrtime);
  idl_array.add_dependency_idls(dom);
  idl_array.add_untested_idls('[Exposed=(Window,Worker)] interface PerformanceEntry { };');
  idl_array.add_objects({
    Performance: ["performance"]
  });
  idl_array.test();
}, "Test IDL implementation of user-timing API");
