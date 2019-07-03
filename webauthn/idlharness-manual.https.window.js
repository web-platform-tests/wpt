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
    idlArray.add_objects({
      PublicKeyCredential: ['cred', 'assertion'],
      AuthenticatorAttestationResponse: ['cred.response'],
      AuthenticatorAssertionResponse: ['assertion.response']
    });

    const challengeBytes = new Uint8Array(16);
    window.crypto.getRandomValues(challengeBytes);

    self.cred = await Promise.race([
      new Promise((_, reject) => window.setTimeout(() => {
        reject('Timed out waiting for user to touch security key')
      }, 3000)),
      createCredential({
        options: {
          publicKey: {
            timeout: 3000,
            user: {
              id: new Uint8Array(16),
            },
          }
        }
      }),
    ]);

    if (self.cred) {
      self.assertion = await Promise.race([
        new Promise((_, reject) => window.setTimeout(() => {
          reject('Timed out waiting for user to touch security key')
        }, 3000)),
        navigator.credentials.get({
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
      ]);
    }
  }
);
