// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://wicg.github.io/animation-worklet/

promise_test(async () => {
  const idl = await (await fetch('/interfaces/animation-worklet.idl')).text();
  const idlArray = new IdlArray();
  idlArray.add_idls(idl);
  idlArray.test();
  done();
}, 'Test driver');
