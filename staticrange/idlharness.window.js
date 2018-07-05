// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

// https://w3c.github.io/staticrange/

'use strict';

promise_test(async () => {
  const srcs = ['staticrange', 'dom'];
  const [staticrange, dom] = await Promise.all(
    srcs.map(i => fetch(`/interfaces/${i}.idl`).then(r => r.text())));

  try {
    window.staticRange = new StaticRange({
      start: document.body,
      end: document.body
    });
  } catch (e) {
    // Will be surfaced in idlharness.js's test_object below.
    console.log(e);
  }

  const idl_array = new IdlArray();
  idl_array.add_idls(staticrange);
  idl_array.add_dependency_idls(dom);
  idl_array.add_objects({
    StaticRange: ['staticRange'],
  });
  idl_array.test();
}, 'staticrange IDL');
