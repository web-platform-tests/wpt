// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from instant-constructor test
  in V8's mjsunit test instant-constructor.js
features: [Temporal]
---*/

let inst1 = new Temporal.Instant(1234567890123456789n);
assert.sameValue(inst1.epochNanoseconds, 1234567890123456789n);
assert.sameValue(inst1.epochMilliseconds, 1234567890123);
let inst2 = new Temporal.Instant(-1234567890123456789n);
assert.sameValue(inst2.epochNanoseconds, -1234567890123456789n);
assert.sameValue(inst2.epochMilliseconds, -1234567890124);
assert.throws(TypeError, () => Temporal.Instant(1234567890123456789n));
assert.throws(TypeError, () => {
  let inst = new Temporal.Instant(undefined);
});
assert.throws(TypeError, () => {
  let inst = new Temporal.Instant(null);
});
assert.sameValue(new Temporal.Instant(true).epochNanoseconds, 1n);
assert.sameValue(new Temporal.Instant(false).epochNanoseconds, 0n);
assert.throws(TypeError, () => {
  let inst = Temporal.Instant(12345);
});
assert.sameValue(new Temporal.Instant('1234567890123456789').epochNanoseconds, 1234567890123456789n);
assert.throws(TypeError, () => {
  let inst = new Temporal.Instant(Symbol(12345n));
});
assert.throws(RangeError, () => {
  let inst = new Temporal.Instant(8640000000000000000001n);
});
assert.throws(RangeError, () => {
  let inst = new Temporal.Instant(-8640000000000000000001n);
});
assert.sameValue(new Temporal.Instant(8640000000000000000000n).epochNanoseconds, 8640000000000000000000n);
assert.sameValue(new Temporal.Instant(-8640000000000000000000n).epochNanoseconds, -8640000000000000000000n);
