// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-time-with-plain-time test
  in V8's mjsunit test plain-date-time-with-plain-time.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.PlainDateTime(1911, 10, 10, 4, 5, 6, 7, 8, 9);
let badDate = { withPlainTime: d1.withPlainTime };
assert.throws(TypeError, () => badDate.withPlainTime());
let timeRecord = {
  hour: 9,
  minute: 8,
  second: 7,
  millisecond: 6,
  microsecond: 5,
  nanosecond: 4
};
TemporalHelpers.assertPlainDateTime(d1.withPlainTime(timeRecord), 1911, 10, 'M10', 10, 9, 8, 7, 6, 5, 4);

let d3 = new Temporal.PlainDateTime(2020, 3, 15, 4, 5, 6, 7, 8, 9, 'roc');
TemporalHelpers.assertPlainDateTime(d3.withPlainTime(timeRecord), 109, 3, 'M03', 15, 9, 8, 7, 6, 5, 4, '', 'roc', 109);
assert.throws(TypeError, () => d1.withPlainTime(null));
assert.throws(TypeError, () => d1.withPlainTime(true));
assert.throws(TypeError, () => d1.withPlainTime(false));
assert.throws(TypeError, () => d1.withPlainTime(Infinity));
assert.throws(RangeError, () => d1.withPlainTime('invalid iso8601 string'));
assert.throws(TypeError, () => d1.withPlainTime(123));
assert.throws(TypeError, () => d1.withPlainTime(456n));
