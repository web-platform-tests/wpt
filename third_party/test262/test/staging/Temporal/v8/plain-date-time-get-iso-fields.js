// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-time-get-iso-fields test
  in V8's mjsunit test plain-date-time-get-iso-fields.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(1, 2, 3, 4, 5, 6, 7, 8, 9), 1, 2, 'M02', 3, 4, 5, 6, 7, 8, 9);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(1, 2, 3, 4, 5, 6, 7, 8), 1, 2, 'M02', 3, 4, 5, 6, 7, 8, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(1, 2, 3, 4, 5, 6, 7), 1, 2, 'M02', 3, 4, 5, 6, 7, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(1, 2, 3, 4, 5, 6), 1, 2, 'M02', 3, 4, 5, 6, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(1, 2, 3, 4, 5), 1, 2, 'M02', 3, 4, 5, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(1, 2, 3, 4), 1, 2, 'M02', 3, 4, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(1, 2, 3), 1, 2, 'M02', 3, 0, 0, 0, 0, 0, 0);
assert.throws(RangeError, () => new Temporal.PlainDateTime(1, 2));
assert.throws(RangeError, () => new Temporal.PlainDateTime(1));
assert.throws(RangeError, () => new Temporal.PlainDateTime());
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(-25406, 1, 1), -25406, 1, 'M01', 1, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(29345, 12, 31, 23, 59, 59, 999, 999, 999), 29345, 12, 'M12', 31, 23, 59, 59, 999, 999, 999);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(false, true, true, undefined, true), 0, 1, 'M01', 1, 0, 1, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(11.9, 12.8, 13.7, 14.6, 15.5, 16.6, 17.7, 18.8, 1.999999), 11, 12, 'M12', 13, 14, 15, 16, 17, 18, 1);
