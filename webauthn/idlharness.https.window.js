// META: timeout=long
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js
// META: script=helpers.js

// https://w3c.github.io/webauthn/

'use strict';

idl_test(
  ['webauthn'],
  ['credential-management'],
  async idlArray => {
    idlArray.add_untested_idls("[Exposed=(Window,Worker)] interface ArrayBuffer {};");
    idlArray.add_objects({
      WebAuthentication: ['navigator.authentication'],
      // The following are tested in idlharness-manual.https.window.js:
      // PublicKeyCredential: ['cred', 'assertion'],
      // AuthenticatorAttestationResponse: ['cred.response'],
      // AuthenticatorAssertionResponse: ['assertion.response']
    });

    const challengeBytes = new Uint8Array(16);
    window.crypto.getRandomValues(challengeBytes);
  }
);
