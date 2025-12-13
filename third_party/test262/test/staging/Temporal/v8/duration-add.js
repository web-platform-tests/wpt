// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from duration-add test
  in V8's mjsunit test duration-add.js
features: [Temporal]
---*/

let d1 = new Temporal.Duration();
let badDur = { add: d1.add };
assert.throws(TypeError, () => badDur.add(d1));
let d2 = new Temporal.Duration(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
assert.throws(RangeError, () => d2.add(d1));
assert.throws(RangeError, () => d1.add(d2));
assert.throws(RangeError, () => d2.add(d2));
let d3 = new Temporal.Duration(100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000);
assert.throws(RangeError, () => d3.add(d3));
let d4 = new Temporal.Duration(-1, -2, -3, -4, -5, -6, -7, -8, -9, -10);
assert.throws(RangeError, () => d4.add(d1));
assert.throws(RangeError, () => d1.add(d4));
assert.throws(RangeError, () => d4.add(d4));
assert.throws(RangeError, () => d2.add(d4));
assert.throws(RangeError, () => d4.add(d2));
