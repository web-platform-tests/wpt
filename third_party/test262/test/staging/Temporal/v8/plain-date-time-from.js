// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-time-from test
  in V8's mjsunit test plain-date-time-from.js
features: [Temporal]
---*/

let d1 = Temporal.Now.plainDateTimeISO();
[
  true,
  false,
  'string is invalid',
  Symbol(),
  123,
  456n,
  Infinity,
  NaN,
  null
].forEach(function (invalidOptions) {
  assert.throws(TypeError, () => Temporal.PlainDateTime.from(d1, invalidOptions));
});
assert.throws(RangeError, () => Temporal.PlainDateTime.from(d1, { overflow: 'invalid overflow' }));
[
  undefined,
  {},
  { overflow: 'constrain' },
  { overflow: 'reject' }
].forEach(function (validOptions) {
  let d = new Temporal.PlainDateTime(1, 2, 3, 4, 5, 6, 7, 8, 9);
  let d2 = Temporal.PlainDateTime.from(d, validOptions);
  assert.sameValue(d2.year, 1);
  assert.sameValue(d2.month, 2);
  assert.sameValue(d2.monthCode, 'M02');
  assert.sameValue(d2.day, 3);
  assert.sameValue(d2.hour, 4);
  assert.sameValue(d2.minute, 5);
  assert.sameValue(d2.second, 6);
  assert.sameValue(d2.millisecond, 7);
  assert.sameValue(d2.microsecond, 8);
  assert.sameValue(d2.nanosecond, 9);
  assert.sameValue(d2.calendarId, 'iso8601');
});
[
  undefined,
  {},
  { overflow: 'constrain' },
  { overflow: 'reject' }
].forEach(function (validOptions) {
  let d3 = Temporal.PlainDateTime.from({
    year: 9,
    month: 8,
    day: 7,
    hour: 6,
    minute: 5,
    second: 4,
    millisecond: 3,
    microsecond: 2,
    nanosecond: 1
  }, validOptions);
  assert.sameValue(d3.year, 9);
  assert.sameValue(d3.month, 8);
  assert.sameValue(d3.monthCode, 'M08');
  assert.sameValue(d3.day, 7);
  assert.sameValue(d3.hour, 6);
  assert.sameValue(d3.minute, 5);
  assert.sameValue(d3.second, 4);
  assert.sameValue(d3.millisecond, 3);
  assert.sameValue(d3.microsecond, 2);
  assert.sameValue(d3.nanosecond, 1);
  assert.sameValue(d3.calendarId, 'iso8601');
});
[
  undefined,
  {},
  { overflow: 'constrain' }
].forEach(function (validOptions) {
  let d4 = Temporal.PlainDateTime.from({
    year: 9,
    month: 14,
    day: 32,
    hour: 24,
    minute: 60,
    second: 60,
    millisecond: 1000,
    microsecond: 1000,
    nanosecond: 1000
  }, validOptions);
  assert.sameValue(d4.year, 9);
  assert.sameValue(d4.month, 12);
  assert.sameValue(d4.monthCode, 'M12');
  assert.sameValue(d4.day, 31);
  assert.sameValue(d4.hour, 23);
  assert.sameValue(d4.minute, 59);
  assert.sameValue(d4.second, 59);
  assert.sameValue(d4.millisecond, 999);
  assert.sameValue(d4.microsecond, 999);
  assert.sameValue(d4.nanosecond, 999);
  assert.sameValue(d4.calendarId, 'iso8601');
});
assert.throws(RangeError, () => Temporal.PlainDateTime.from({
  year: 9,
  month: 14,
  day: 30
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDateTime.from({
  year: 9,
  month: 12,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDateTime.from({
  year: 9,
  month: 12,
  day: 31,
  hour: 24
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDateTime.from({
  year: 9,
  month: 12,
  day: 31,
  minute: 60
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDateTime.from({
  year: 9,
  month: 12,
  day: 31,
  second: 60
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDateTime.from({
  year: 9,
  month: 12,
  day: 31,
  millisecond: 1000
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDateTime.from({
  year: 9,
  month: 12,
  day: 31,
  microsecond: 1000
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDateTime.from({
  year: 9,
  month: 12,
  day: 31,
  nanosecond: 1000
}, { overflow: 'reject' }));
