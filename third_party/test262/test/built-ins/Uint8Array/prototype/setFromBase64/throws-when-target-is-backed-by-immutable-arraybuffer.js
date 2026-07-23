// Copyright (C) 2026 Kevin Gibbons. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-uint8array.prototype.setfrombase64
description: Uint8Array.prototype.setFromBase64 throws a TypeError when the target is backed by an immutable ArrayBuffer.
features: [ArrayBuffer, TypedArray, uint8array-base64, immutable-arraybuffer]
---*/

var iab = (new ArrayBuffer(10)).transferToImmutable();
var target = new Uint8Array(iab);

assert.throws(TypeError, function () {
  target.setFromBase64('Zg==');
});

assert.throws(TypeError, function () {
  target.setFromBase64('');
});
