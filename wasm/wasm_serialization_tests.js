// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function TestInstantiateInWorker() {
  return createWasmModule()
    .then((mod) => {
      var worker = new Worker("wasm_serialization_worker.js");
      return new Promise((resolve, reject) => {
        worker.postMessage(mod);
        worker.onmessage = function(event) {
          resolve(event.data);
        }
      });
    })
    .then(data => assert_equals(data, 43))
    .catch(error => assert_unreached(error));
}

function ascii(a) { return a.charCodeAt(0); }

function findStartOfWasmHeader(byteView) {
  for (var i = 0; i < byteView.length - 2; ++i) {
    if (byteView[i] === ascii('a') &&
        byteView[i+1] === ascii('s') &&
        byteView[i+2] === ascii('m')) {
      return i;
    }
  }
  return -1;
}

function TestIncompatibleDowngrade() {
  return createWasmModule()
    .then((mod) => {
      var buffer = window.internals.serializeWithInlineWasm(mod);
      var byteView = new Uint8Array(buffer);
      // The serialized payload starts with some serialization header, followed
      // by the wasm wire bytes. Those should start with the characters
      // 'a' 's' 'm'.
      // Find the start of that sequence and invalidate the wire bytes by
      // clearing the first byte.
      var startOfWasmHeader = findStartOfWasmHeader(byteView);
      assert_greater_than(startOfWasmHeader, 0,
                          "The wire format should contain a wasm header.");
      byteView[startOfWasmHeader] = 0;
      // Also invalidate the serialized blob. That follows the wire bytes.
      // Start from the end and clear the first non-null byte.
      var invalidalidated = false;
      for (var i = byteView.length - 1; i >= startOfWasmHeader + 3; --i) {
        if (byteView[i] != 0) {
          byteView[i] = 0;
          invalidated = true;
          break;
        }
      }
      assert_true(invalidated,
                  "the serialized blob should contain some non-null bytes.");

      var deserialized = window.internals.deserializeBufferContainingWasm(byteView.buffer);
      assert_equals(deserialized, null);
    });
}
