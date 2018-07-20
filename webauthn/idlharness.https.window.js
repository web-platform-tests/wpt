// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js
// META: script=helpers.js
// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=/gen/layout_test_data/mojo/public/js/mojo_bindings.js
// META: script=/gen/third_party/blink/public/platform/modules/webauth/virtual_authenticator.mojom.js
// META: script=resources/virtual-navigator-credentials.js

// https://w3c.github.io/webauthn/

'use strict';

u2f_promise_test(async t => {
  idl_test(
    ['webauthn'],
    ['credential-management'],
    async idlArray => {
      idlArray.add_untested_idls("[Exposed=(Window,Worker)] interface ArrayBuffer {};");
      idlArray.add_objects({
        WebAuthentication: ['navigator.authentication'],
        PublicKeyCredential: ['cred'],
        AuthenticatorAssertionResponse: ['assertionResponse']
      });

      let challengeBytes = new Uint8Array(16);
      window.crypto.getRandomValues(challengeBytes);

      let createCred = createCredential({
        options: {
          publicKey: {
            timeout: 3000,
            user: {
              id: new Uint8Array(16),
            },
          }
        }
      }).then(cred => self.cred = cred);

      return Promise.all([
          createCred,
          window.test_driver.authenticate_u2f(),
        ])
        .then(() => {
          return navigator.credentials.get({
            publicKey: {
              timeout: 3000,
              allowCredentials: [{
                id: cred.rawId,
                transports: ["usb", "nfc", "ble"],
                type: "public-key"
              }],
              challenge: challengeBytes,
            }
          })
        })
        .then(assertion => {
          self.assertionResponse = assertion.response;
        });
    },
    'WebAuthn interfaces.'
  );
})
