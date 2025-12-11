// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from instant-from-epoch-milliseconds test
  in V8's mjsunit test instant-from-epoch-milliseconds.js
features: [Temporal]
---*/

let bigint_nano = 567890123456789000000n;
let milli = 567890123456789;
let bigint_milli = BigInt(milli);
let inst1 = new Temporal.Instant(bigint_nano);
assert.throws(TypeError, () => Temporal.Instant.fromEpochMilliseconds(bigint_milli));
let inst2 = Temporal.Instant.fromEpochMilliseconds(milli);
assert(inst2.equals(inst1));
let just_fit_neg = -8640000000000000;
let just_fit_pos = 8640000000000000;
let too_big = 8640000000000001;
let too_small = -8640000000000001;
assert.throws(RangeError, () => Temporal.Instant.fromEpochMilliseconds(too_small));
assert.throws(RangeError, () => Temporal.Instant.fromEpochMilliseconds(too_big));
assert.sameValue(Temporal.Instant.fromEpochMilliseconds(just_fit_neg).epochMilliseconds, just_fit_neg);
assert.sameValue(Temporal.Instant.fromEpochMilliseconds(just_fit_pos).epochMilliseconds, just_fit_pos);
