// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

// https://wicg.github.io/aom/spec/

promise_test(async () => {
  const idl = await fetch('/interfaces/aom.idl').then(r => r.text());
  const dom = await fetch('/interfaces/dom.idl').then(r => r.text());

  const idl_array = new IdlArray();
  idl_array.add_idls(idl);
  idl_array.add_dependency_idls(dom);
  idl_array.test();
}, 'aom interfaces');
