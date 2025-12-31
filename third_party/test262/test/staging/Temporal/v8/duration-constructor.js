// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from duration-constructor test
  in V8's mjsunit test duration-constructor.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.Duration();
TemporalHelpers.assertDuration(d1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
let d2 = new Temporal.Duration(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
TemporalHelpers.assertDuration(d2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
let d3 = new Temporal.Duration(100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000);
TemporalHelpers.assertDuration(d3, 100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000);
let d4 = new Temporal.Duration(-1, -2, -3, -4, -5, -6, -7, -8, -9, -10);
TemporalHelpers.assertDuration(d4, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10);
assert.throws(TypeError, () => Temporal.Duration());
TemporalHelpers.assertDuration(new Temporal.Duration(undefined, 234, true, false, '567'), 0, 234, 1, 0, 567, 0, 0, 0, 0, 0);
assert.throws(TypeError, () => new Temporal.Duration(Symbol(123)));
assert.throws(TypeError, () => new Temporal.Duration(123n));
assert.throws(RangeError, () => new Temporal.Duration(1, 2, 3, 4, 5, 6, 7, 8, 9, Infinity));
assert.throws(RangeError, () => new Temporal.Duration(1, 2, 3, 4, 5, 6, 7, 8, Infinity));
assert.throws(RangeError, () => new Temporal.Duration(1, 2, 3, 4, 5, 6, 7, Infinity));
assert.throws(RangeError, () => new Temporal.Duration(1, 2, 3, 4, 5, 6, Infinity));
assert.throws(RangeError, () => new Temporal.Duration(1, 2, 3, 4, 5, Infinity));
assert.throws(RangeError, () => new Temporal.Duration(1, 2, 3, 4, Infinity));
assert.throws(RangeError, () => new Temporal.Duration(1, 2, 3, Infinity));
assert.throws(RangeError, () => new Temporal.Duration(1, 2, Infinity));
assert.throws(RangeError, () => new Temporal.Duration(1, Infinity));
assert.throws(RangeError, () => new Temporal.Duration(Infinity));
assert.throws(RangeError, () => new Temporal.Duration(-1, -2, -3, -4, -5, -6, -7, -8, -9, -Infinity));
assert.throws(RangeError, () => new Temporal.Duration(-1, -2, -3, -4, -5, -6, -7, -8, -Infinity));
assert.throws(RangeError, () => new Temporal.Duration(-1, -2, -3, -4, -5, -6, -7, -Infinity));
assert.throws(RangeError, () => new Temporal.Duration(-1, -2, -3, -4, -5, -6, -Infinity));
assert.throws(RangeError, () => new Temporal.Duration(-1, -2, -3, -4, -5, -Infinity));
assert.throws(RangeError, () => new Temporal.Duration(-1, -2, -3, -4, -Infinity));
assert.throws(RangeError, () => new Temporal.Duration(-1, -2, -3, -Infinity));
assert.throws(RangeError, () => new Temporal.Duration(-1, -2, -Infinity));
assert.throws(RangeError, () => new Temporal.Duration(-1, -Infinity));
assert.throws(RangeError, () => new Temporal.Duration(-Infinity));
assert.throws(RangeError, () => new Temporal.Duration(1, -2));
assert.throws(RangeError, () => new Temporal.Duration(1, 0, -2));
assert.throws(RangeError, () => new Temporal.Duration(-1, 0, 0, 3));
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 1, -1));
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, -1, 1));
