// META: script=/resources/idlharness-shadowrealm.js
idl_test_shadowrealm(
  ['WebCryptoAPI'],
  ['html', 'dom'],
  idl_array => {
    idl_array.add_objects({
      Crypto: ['crypto'],
    });
  }
);
