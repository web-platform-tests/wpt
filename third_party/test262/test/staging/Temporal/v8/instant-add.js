// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from instant-add test
  in V8's mjsunit test instant-add.js
features: [Temporal]
---*/

let i1 = new Temporal.Instant(50000n);
assert.sameValue(i1.add(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 3, 2, 1)).epochNanoseconds, 3052001n);
assert.sameValue(i1.add(new Temporal.Duration(0, 0, 0, 0, 0, 0, 4, 3, 2, 1)).epochNanoseconds, BigInt(4 * 1000000000) + 3052001n);
assert.sameValue(i1.add(new Temporal.Duration(0, 0, 0, 0, 0, 5, 4, 3, 2, 1)).epochNanoseconds, BigInt(5 * 60 + 4) * 1000000000n + 3052001n);
assert.sameValue(i1.add(new Temporal.Duration(0, 0, 0, 0, 6, 5, 4, 3, 2, 1)).epochNanoseconds, BigInt(6 * 3600 + 5 * 60 + 4) * 1000000000n + 3052001n);
assert.sameValue(i1.add(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, -3, -2, -1)).epochNanoseconds, -2952001n);
assert.sameValue(i1.add(new Temporal.Duration(0, 0, 0, 0, 0, 0, -4, -3, -2, -1)).epochNanoseconds, BigInt(-4 * 1000000000) - 2952001n);
assert.sameValue(i1.add(new Temporal.Duration(0, 0, 0, 0, 0, -5, -4, -3, -2, -1)).epochNanoseconds, BigInt(5 * 60 + 4) * -1000000000n - 2952001n);
assert.sameValue(i1.add(new Temporal.Duration(0, 0, 0, 0, -6, -5, -4, -3, -2, -1)).epochNanoseconds, BigInt(6 * 3600 + 5 * 60 + 4) * -1000000000n - 2952001n);
let badInstant = { add: i1.add };
assert.throws(TypeError, () => badInstant.add(new Temporal.Duration(0, 0, 0, 0, 5)));
assert.throws(RangeError, () => i1.add(new Temporal.Duration(1)));
assert.throws(RangeError, () => i1.add(new Temporal.Duration(0, 2)));
assert.throws(RangeError, () => i1.add(new Temporal.Duration(0, 0, 3)));
assert.throws(RangeError, () => i1.add(new Temporal.Duration(0, 0, 0, 4)));
assert.throws(RangeError, () => i1.add(new Temporal.Duration(-1)));
assert.throws(RangeError, () => i1.add(new Temporal.Duration(0, -2)));
assert.throws(RangeError, () => i1.add(new Temporal.Duration(0, 0, -3)));
assert.throws(RangeError, () => i1.add(new Temporal.Duration(0, 0, 0, -4)));
let i2 = new Temporal.Instant(86400n * 99999999999999999n);
assert.throws(RangeError, () => i2.add(new Temporal.Duration(0, 0, 0, 0, 999999999)));
