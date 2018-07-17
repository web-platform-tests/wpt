// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js
// META: script=helpers.js

// https://w3c.github.io/webauthn/

'use strict';

promise_test(() => {
  const execute_test = () => idl_test(
    ['webauthn'],
    ['credential-management'],
    idlArray => {
      idlArray.add_objects({
        WebAuthentication: ['navigator.authentication'],
        PublicKeyCredential: ['cred'],
        AuthenticatorAssertionResponse: ['assertion']
      });
    },
    'WebAuthn interfaces.'
  );

  const challengeBytes = new Uint8Array(16);
  window.crypto.getRandomValues(challengeBytes);

  return createCredential({
      options: {
        publicKey: {
          timeout: 3000,
          user: {
            id: new Uint8Array(16),
          },
          challenge: challengeBytes,
        }
      }
    })
    .then(cred => {
      self.cred = cred;
      return navigator.credentials.get({
        options: {
          publicKey: {
            timeout: 3000,
            allowCredentials: [{
              id: cred.rawId,
              transports: ["usb", "nfc", "ble"],
              type: "public-key"
            }],
          }
        }
      });
    })
    .then(assertion => {
      self.assertion = assertion;
    })
    .then(execute_test)
    .catch(reason => {
      execute_test();
      return Promise.reject(reason);
    });
});
