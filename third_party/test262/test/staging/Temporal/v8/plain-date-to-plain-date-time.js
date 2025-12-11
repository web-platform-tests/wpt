// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-to-plain-date-time test
  in V8's mjsunit test plain-date-to-plain-date-time.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.PlainDate(2021, 12, 11);
let badDate = { toPlainDateTime: d1.toPlainDateTime };
assert.throws(TypeError, () => badDate.toPlainDateTime());
assert.throws(TypeError, () => d1.toPlainDateTime(null));
assert.throws(RangeError, () => d1.toPlainDateTime('string is invalid'));
assert.throws(TypeError, () => d1.toPlainDateTime(true));
assert.throws(TypeError, () => d1.toPlainDateTime(false));
assert.throws(TypeError, () => d1.toPlainDateTime(NaN));
assert.throws(TypeError, () => d1.toPlainDateTime(Infinity));
assert.throws(TypeError, () => d1.toPlainDateTime(123));
assert.throws(TypeError, () => d1.toPlainDateTime(456n));
assert.throws(TypeError, () => d1.toPlainDateTime(Symbol()));
assert.throws(TypeError, () => d1.toPlainDateTime({}));
TemporalHelpers.assertPlainDateTime(d1.toPlainDateTime({ hour: 23 }), 2021, 12, 'M12', 11, 23, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(d1.toPlainDateTime({ minute: 23 }), 2021, 12, 'M12', 11, 0, 23, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(d1.toPlainDateTime({ second: 23 }), 2021, 12, 'M12', 11, 0, 0, 23, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(d1.toPlainDateTime({ millisecond: 23 }), 2021, 12, 'M12', 11, 0, 0, 0, 23, 0, 0);
TemporalHelpers.assertPlainDateTime(d1.toPlainDateTime({ microsecond: 23 }), 2021, 12, 'M12', 11, 0, 0, 0, 0, 23, 0);
TemporalHelpers.assertPlainDateTime(d1.toPlainDateTime({ nanosecond: 23 }), 2021, 12, 'M12', 11, 0, 0, 0, 0, 0, 23);
TemporalHelpers.assertPlainDateTime(d1.toPlainDateTime(), 2021, 12, 'M12', 11, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(d1.toPlainDateTime({
  hour: 9,
  minute: 8,
  second: 7,
  millisecond: 6,
  microsecond: 5,
  nanosecond: 4
}), 2021, 12, 'M12', 11, 9, 8, 7, 6, 5, 4);
