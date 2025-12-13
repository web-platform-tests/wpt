// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-time-to-plain-time test
  in V8's mjsunit test plain-date-time-to-plain-time.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.PlainDateTime(2021, 12, 11, 1, 2, 3, 4, 5, 6);
let badDateTime = { toPlainTime: d1.toPlainTime };
assert.throws(TypeError, () => badDateTime.toPlainTime());
TemporalHelpers.assertPlainTime(d1.toPlainTime(), 1, 2, 3, 4, 5, 6);
