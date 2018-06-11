// META: global=window,worker
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

promise_test(async() => {
  const text = await (await fetch('/interfaces/WebCryptoAPI.idl')).text();
  const idl_array = new IdlArray();
  idl_array.add_untested_idls("[Global] interface Window { };");
  idl_array.add_untested_idls("interface ArrayBuffer {};");
  idl_array.add_untested_idls("interface ArrayBufferView {};");
  idl_array.add_idls(text);
  idl_array.add_objects({"Crypto":["crypto"], "SubtleCrypto":["crypto.subtle"]});
  idl_array.test();
}, 'WebCrypto API IDL');
