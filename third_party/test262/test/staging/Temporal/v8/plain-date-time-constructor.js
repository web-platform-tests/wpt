// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-time-constructor test
  in V8's mjsunit test plain-date-time-constructor.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.PlainDateTime(1911, 10, 10);
TemporalHelpers.assertPlainDateTime(d1, 1911, 10, 'M10', 10, 0, 0, 0, 0, 0, 0);
let d2 = new Temporal.PlainDateTime(2020, 3, 12);
TemporalHelpers.assertPlainDateTime(d2, 2020, 3, 'M03', 12, 0, 0, 0, 0, 0, 0);
let d3 = new Temporal.PlainDateTime(1, 12, 25);
TemporalHelpers.assertPlainDateTime(d3, 1, 12, 'M12', 25, 0, 0, 0, 0, 0, 0);
let d4 = new Temporal.PlainDateTime(1970, 1, 1);
TemporalHelpers.assertPlainDateTime(d4, 1970, 1, 'M01', 1, 0, 0, 0, 0, 0, 0);
let d5 = new Temporal.PlainDateTime(-10, 12, 1);
TemporalHelpers.assertPlainDateTime(d5, -10, 12, 'M12', 1, 0, 0, 0, 0, 0, 0);
let d6 = new Temporal.PlainDateTime(-25406, 1, 1);
TemporalHelpers.assertPlainDateTime(d6, -25406, 1, 'M01', 1, 0, 0, 0, 0, 0, 0);
let d7 = new Temporal.PlainDateTime(26890, 12, 31);
TemporalHelpers.assertPlainDateTime(d7, 26890, 12, 'M12', 31, 0, 0, 0, 0, 0, 0);
assert.throws(TypeError, () => Temporal.PlainDateTime(2021, 7, 1));
assert.throws(RangeError, () => new Temporal.PlainDateTime());
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 0));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 13));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 0));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 32));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, -7, 1));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, -7, -1));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 0, 1));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 13, 1));
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 1, 31), 2021, 1, 'M01', 31, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 2, 28), 2021, 2, 'M02', 28, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 3, 31), 2021, 3, 'M03', 31, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 4, 30), 2021, 4, 'M04', 30, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 5, 31), 2021, 5, 'M05', 31, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 6, 30), 2021, 6, 'M06', 30, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 31), 2021, 7, 'M07', 31, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 8, 31), 2021, 8, 'M08', 31, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 9, 30), 2021, 9, 'M09', 30, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 10, 31), 2021, 10, 'M10', 31, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 11, 30), 2021, 11, 'M11', 30, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 12, 31), 2021, 12, 'M12', 31, 0, 0, 0, 0, 0, 0);
assert.throws(RangeError, () => new Temporal.PlainDateTime(1900, 2, 29));
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2000, 2, 29), 2000, 2, 'M02', 29, 0, 0, 0, 0, 0, 0);
assert.throws(RangeError, () => new Temporal.PlainDateTime(2001, 2, 29));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2002, 2, 29));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2003, 2, 29));
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2004, 2, 29), 2004, 2, 'M02', 29, 0, 0, 0, 0, 0, 0);
assert.throws(RangeError, () => new Temporal.PlainDateTime(2100, 2, 29));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 1, 32));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 2, 29));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 3, 32));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 4, 31));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 5, 32));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 6, 31));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 32));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 8, 32));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 9, 31));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 10, 32));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 11, 31));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 12, 32));
assert.throws(RangeError, () => new Temporal.PlainDateTime(Infinity, 12, 1));
assert.throws(RangeError, () => new Temporal.PlainDateTime(-Infinity, 12, 1));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 12, Infinity));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 12, -Infinity));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, -Infinity, 1));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, Infinity, 1));
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 9), 2021, 7, 'M07', 9, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 9, 1, 2, 3, 4, 5, 6), 2021, 7, 'M07', 9, 1, 2, 3, 4, 5, 6);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 9, 1, 2, 3, 4, 5), 2021, 7, 'M07', 9, 1, 2, 3, 4, 5, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 9, 1, 2, 3, 4), 2021, 7, 'M07', 9, 1, 2, 3, 4, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 9, 1, 2, 3), 2021, 7, 'M07', 9, 1, 2, 3, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 9, 1, 2), 2021, 7, 'M07', 9, 1, 2, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 9, 1, 0), 2021, 7, 'M07', 9, 1, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 9, 0, 0, 0, 0, 0, 0), 2021, 7, 'M07', 9, 0, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 9, 23, 59, 59, 999, 999, 999), 2021, 7, 'M07', 9, 23, 59, 59, 999, 999, 999);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 9, true, false, undefined, true), 2021, 7, 'M07', 9, 1, 0, 0, 1, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 9, 11.9, 12.8, 13.7, 14.6, 15.5, 1.999999), 2021, 7, 'M07', 9, 11, 12, 13, 14, 15, 1);
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, -Infinity));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, Infinity));
assert.throws(TypeError, () => new Temporal.PlainDateTime(2021, 7, 9, Symbol(2)));
assert.throws(TypeError, () => new Temporal.PlainDateTime(2021, 7, 9, 3n));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, 24));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, 0, 60));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, 0, 0, 60));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, 0, 0, 0, 1000));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, 0, 0, 0, 0, 1000));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, 0, 0, 0, 0, 0, 1000));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, -1));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, 0, -1));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, 0, 0, -1));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, 0, 0, 0, -1));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, 0, 0, 0, 0, -1));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 9, 0, 0, 0, 0, 0, -1));
