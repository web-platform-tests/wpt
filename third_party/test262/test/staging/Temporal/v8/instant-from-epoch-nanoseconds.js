// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from instant-from-epoch-nanoseconds test
  in V8's mjsunit test instant-from-epoch-nanoseconds.js
features: [Temporal]
---*/

let bigint1 = 1234567890123456789n;
let inst1 = new Temporal.Instant(bigint1);
let inst2 = Temporal.Instant.fromEpochNanoseconds(bigint1);
assert(inst2.equals(inst1));
let just_fit_neg_bigint = -8640000000000000000000n;
let just_fit_pos_bigint = 8640000000000000000000n;
let too_big_bigint = 8640000000000000000001n;
let too_small_bigint = -8640000000000000000001n;
assert.throws(RangeError, () => {
  let inst = Temporal.Instant.fromEpochNanoseconds(too_small_bigint);
});
assert.throws(RangeError, () => {
  let inst = Temporal.Instant.fromEpochNanoseconds(too_big_bigint);
});
assert.sameValue(Temporal.Instant.fromEpochNanoseconds(just_fit_neg_bigint).epochNanoseconds, just_fit_neg_bigint);
assert.sameValue(Temporal.Instant.fromEpochNanoseconds(just_fit_pos_bigint).epochNanoseconds, just_fit_pos_bigint);
