// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://w3c.github.io/payment-handler/

promise_test(async () => {
  const idl = await fetch('/interfaces/payment-handler.idl').then(r => r.text());
  const sw = await fetch('/interfaces/ServiceWorker.idl').then(r => r.text());
  const dw = await fetch('/interfaces/dedicated-workers.idl').then(r => r.text());
  const dom = await fetch('/interfaces/dom.idl').then(r => r.text());

  const idlArray = new IdlArray();
  idlArray.add_idls(idl);
  idlArray.add_dependency_idls(sw);
  idlArray.add_dependency_idls(dw);
  idlArray.add_dependency_idls(dom);
  idlArray.test();
}, 'payment-handler interfaces.');
