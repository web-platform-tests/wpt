// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

if (self.importScripts) {
  importScripts('/resources/testharness.js');
  importScripts('/resources/WebIDLParser.js', '/resources/idlharness.js');
}

// https://w3c.github.io/payment-handler/

promise_test(async () => {
  const text = await fetch('/interfaces/webauthn.idl').then(response =>
  response.text(),
  );
  const idlArray = new IdlArray();
  idlArray.add_idls(text);
  
  // static IDL tests
  idlArray.add_untested_idls("interface Navigator { };");
  // TODO: change to "tested" for real browsers?
  idlArray.add_untested_idls("partial interface Navigator { readonly attribute WebAuthentication authentication; };");
  idlArray.add_objects({
    WebAuthentication: ["navigator.authentication"]
  });
  idlArray.test();
  done();
}, 'WebAuthn interfaces.');