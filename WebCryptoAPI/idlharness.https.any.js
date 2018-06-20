// META: global=window,dedicatedworker,sharedworker
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

promise_test(async() => {
  const idl_array = new IdlArray();
  idl_array.add_idls(await (await fetch('/interfaces/WebCryptoAPI.idl')).text());
  idl_array.add_dependency_idls(await (await fetch('/interfaces/webidl.idl')).text());
  idl_array.add_dependency_idls(await (await fetch('/interfaces/html.idl')).text());
  idl_array.add_objects({"Crypto":["crypto"], "SubtleCrypto":["crypto.subtle"]});
  idl_array.test();
}, 'WebCrypto API IDL');
