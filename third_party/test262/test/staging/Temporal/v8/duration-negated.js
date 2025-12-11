// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from duration-negated test
  in V8's mjsunit test duration-negated.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.Duration();
TemporalHelpers.assertDuration(d1.negated(), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
let d2 = new Temporal.Duration(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
TemporalHelpers.assertDuration(d2.negated(), -1, -2, -3, -4, -5, -6, -7, -8, -9, -10);
let d3 = new Temporal.Duration(100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000);
TemporalHelpers.assertDuration(d3.negated(), -100000, -200000, -300000, -400000, -500000, -600000, -700000, -800000, -900000, -1000000);
let d4 = new Temporal.Duration(-1, -2, -3, -4, -5, -6, -7, -8, -9, -10);
TemporalHelpers.assertDuration(d4.negated(), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
let d5 = new Temporal.Duration(-100000, -200000, -300000, -400000, -500000, -600000, -700000, -800000, -900000, -1000000);
TemporalHelpers.assertDuration(d5.negated(), 100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000);
