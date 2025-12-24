// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-constructor test
  in V8's mjsunit test plain-date-constructor.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.PlainDate(1911, 10, 10);
TemporalHelpers.assertPlainDate(d1, 1911, 10, 'M10', 10);
let d2 = new Temporal.PlainDate(2020, 3, 12);
TemporalHelpers.assertPlainDate(d2, 2020, 3, 'M03', 12);
let d3 = new Temporal.PlainDate(1, 12, 25);
TemporalHelpers.assertPlainDate(d3, 1, 12, 'M12', 25);
let d4 = new Temporal.PlainDate(1970, 1, 1);
TemporalHelpers.assertPlainDate(d4, 1970, 1, 'M01', 1);
let d5 = new Temporal.PlainDate(-10, 12, 1);
TemporalHelpers.assertPlainDate(d5, -10, 12, 'M12', 1);
let d6 = new Temporal.PlainDate(-25406, 1, 1);
TemporalHelpers.assertPlainDate(d6, -25406, 1, 'M01', 1);
let d7 = new Temporal.PlainDate(26890, 12, 31);
TemporalHelpers.assertPlainDate(d7, 26890, 12, 'M12', 31);
assert.throws(TypeError, () => Temporal.PlainDate(2021, 7, 1));
assert.throws(RangeError, () => new Temporal.PlainDate());
assert.throws(RangeError, () => new Temporal.PlainDate(2021));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 0));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 7));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 13));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 7, 0));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 7, 32));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, -7, 1));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, -7, -1));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 0, 1));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 13, 1));
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2021, 1, 31), 2021, 1, 'M01', 31);
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2021, 2, 28), 2021, 2, 'M02', 28);
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2021, 3, 31), 2021, 3, 'M03', 31);
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2021, 4, 30), 2021, 4, 'M04', 30);
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2021, 5, 31), 2021, 5, 'M05', 31);
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2021, 6, 30), 2021, 6, 'M06', 30);
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2021, 7, 31), 2021, 7, 'M07', 31);
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2021, 8, 31), 2021, 8, 'M08', 31);
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2021, 9, 30), 2021, 9, 'M09', 30);
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2021, 10, 31), 2021, 10, 'M10', 31);
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2021, 11, 30), 2021, 11, 'M11', 30);
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2021, 12, 31), 2021, 12, 'M12', 31);
assert.throws(RangeError, () => new Temporal.PlainDate(1900, 2, 29));
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2000, 2, 29), 2000, 2, 'M02', 29);
assert.throws(RangeError, () => new Temporal.PlainDate(2001, 2, 29));
assert.throws(RangeError, () => new Temporal.PlainDate(2002, 2, 29));
assert.throws(RangeError, () => new Temporal.PlainDate(2003, 2, 29));
TemporalHelpers.assertPlainDate(new Temporal.PlainDate(2004, 2, 29), 2004, 2, 'M02', 29);
assert.throws(RangeError, () => new Temporal.PlainDate(2100, 2, 29));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 1, 32));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 2, 29));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 3, 32));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 4, 31));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 5, 32));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 6, 31));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 7, 32));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 8, 32));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 9, 31));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 10, 32));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 11, 31));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 12, 32));
assert.throws(RangeError, () => new Temporal.PlainDate(Infinity, 12, 1));
assert.throws(RangeError, () => new Temporal.PlainDate(-Infinity, 12, 1));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 12, Infinity));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 12, -Infinity));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, -Infinity, 1));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, Infinity, 1));
