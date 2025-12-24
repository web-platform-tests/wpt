// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from duration-with test
  in V8's mjsunit test duration-with.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let like1 = {
  years: 9,
  months: 8,
  weeks: 7,
  days: 6,
  hours: 5,
  minutes: 4,
  seconds: 3,
  milliseconds: 2,
  microseconds: 1,
  nanoseconds: 10
};
let like2 = {
  years: 9,
  hours: 5
};
let like3 = {
  months: 8,
  minutes: 4
};
let like4 = {
  weeks: 7,
  seconds: 3
};
let like5 = {
  days: 6,
  milliseconds: 2
};
let like6 = {
  microseconds: 987,
  nanoseconds: 123
};
let like7 = {
  years: -9,
  months: -8,
  weeks: -7,
  days: -6,
  hours: -5,
  minutes: -4,
  seconds: -3,
  milliseconds: -2,
  microseconds: -1,
  nanoseconds: -10
};
let d1 = new Temporal.Duration();
TemporalHelpers.assertDuration(d1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertDuration(d1.with(like1), 9, 8, 7, 6, 5, 4, 3, 2, 1, 10);
TemporalHelpers.assertDuration(d1.with(like2), 9, 0, 0, 0, 5, 0, 0, 0, 0, 0);
TemporalHelpers.assertDuration(d1.with(like3), 0, 8, 0, 0, 0, 4, 0, 0, 0, 0);
TemporalHelpers.assertDuration(d1.with(like4), 0, 0, 7, 0, 0, 0, 3, 0, 0, 0);
TemporalHelpers.assertDuration(d1.with(like5), 0, 0, 0, 6, 0, 0, 0, 2, 0, 0);
TemporalHelpers.assertDuration(d1.with(like6), 0, 0, 0, 0, 0, 0, 0, 0, 987, 123);
TemporalHelpers.assertDuration(d1.with(like7), -9, -8, -7, -6, -5, -4, -3, -2, -1, -10);
let d2 = new Temporal.Duration(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
TemporalHelpers.assertDuration(d2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
TemporalHelpers.assertDuration(d2.with(like1), 9, 8, 7, 6, 5, 4, 3, 2, 1, 10);
TemporalHelpers.assertDuration(d2.with(like7), -9, -8, -7, -6, -5, -4, -3, -2, -1, -10);
assert.throws(RangeError, () => d2.with({ years: -1 }));
assert.throws(RangeError, () => d2.with({ months: -2 }));
assert.throws(RangeError, () => d2.with({ weeks: -3 }));
assert.throws(RangeError, () => d2.with({ days: -4 }));
assert.throws(RangeError, () => d2.with({ hours: -5 }));
assert.throws(RangeError, () => d2.with({ minutes: -6 }));
assert.throws(RangeError, () => d2.with({ seconds: -7 }));
assert.throws(RangeError, () => d2.with({ milliseconds: -8 }));
assert.throws(RangeError, () => d2.with({ microseconds: -9 }));
assert.throws(RangeError, () => d2.with({ nanoseconds: -10 }));
let d3 = new Temporal.Duration(100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000);
TemporalHelpers.assertDuration(d3, 100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000);
TemporalHelpers.assertDuration(d3.with(like1), 9, 8, 7, 6, 5, 4, 3, 2, 1, 10);
TemporalHelpers.assertDuration(d3.with(like7), -9, -8, -7, -6, -5, -4, -3, -2, -1, -10);
let d4 = new Temporal.Duration(-1, -2, -3, -4, -5, -6, -7, -8, -9, -10);
TemporalHelpers.assertDuration(d4, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10);
TemporalHelpers.assertDuration(d4.with(like1), 9, 8, 7, 6, 5, 4, 3, 2, 1, 10);
assert.throws(RangeError, () => d4.with({ years: 1 }));
assert.throws(RangeError, () => d4.with({ months: 2 }));
assert.throws(RangeError, () => d4.with({ weeks: 3 }));
assert.throws(RangeError, () => d4.with({ days: 4 }));
assert.throws(RangeError, () => d4.with({ hours: 5 }));
assert.throws(RangeError, () => d4.with({ minutes: 6 }));
assert.throws(RangeError, () => d4.with({ seconds: 7 }));
assert.throws(RangeError, () => d4.with({ milliseconds: 8 }));
assert.throws(RangeError, () => d4.with({ microseconds: 9 }));
assert.throws(RangeError, () => d4.with({ nanoseconds: 10 }));
assert.throws(TypeError, () => d1.with({ year: 1 }));
assert.throws(TypeError, () => d1.with({ month: 1 }));
assert.throws(TypeError, () => d1.with({ week: 1 }));
assert.throws(TypeError, () => d1.with({ day: 1 }));
assert.throws(TypeError, () => d1.with({ hour: 1 }));
assert.throws(TypeError, () => d1.with({ minute: 1 }));
assert.throws(TypeError, () => d1.with({ second: 1 }));
assert.throws(TypeError, () => d1.with({ millisecond: 1 }));
assert.throws(TypeError, () => d1.with({ microsecond: 1 }));
assert.throws(TypeError, () => d1.with({ nanosecond: 1 }));
