// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-from test
  in V8's mjsunit test plain-date-from.js
features: [Temporal]
---*/

let d1 = Temporal.Now.plainDateISO();
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
  assert.throws(TypeError, () => Temporal.PlainDate.from(d1, invalidOptions));
});
assert.throws(RangeError, () => Temporal.PlainDate.from(d1, { overflow: 'invalid overflow' }));
[
  undefined,
  {},
  { overflow: 'constrain' },
  { overflow: 'reject' }
].forEach(function (validOptions) {
  let d = new Temporal.PlainDate(1, 2, 3);
  let d2 = Temporal.PlainDate.from(d, validOptions);
  assert.sameValue(d2.year, 1);
  assert.sameValue(d2.month, 2);
  assert.sameValue(d2.day, 3);
  assert.sameValue(d2.calendarId, 'iso8601');
});
[
  undefined,
  {},
  { overflow: 'constrain' },
  { overflow: 'reject' }
].forEach(function (validOptions) {
  let d3 = Temporal.PlainDate.from({
    year: 9,
    month: 8,
    day: 7
  }, validOptions);
  assert.sameValue(d3.year, 9);
  assert.sameValue(d3.month, 8);
  assert.sameValue(d3.monthCode, 'M08');
  assert.sameValue(d3.day, 7);
  assert.sameValue(d3.calendarId, 'iso8601');
});
[
  undefined,
  {},
  { overflow: 'constrain' }
].forEach(function (validOptions) {
  let d4 = Temporal.PlainDate.from({
    year: 9,
    month: 14,
    day: 32
  }, validOptions);
  assert.sameValue(d4.year, 9);
  assert.sameValue(d4.month, 12);
  assert.sameValue(d4.monthCode, 'M12');
  assert.sameValue(d4.day, 31);
  assert.sameValue(d4.calendarId, 'iso8601');
});
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 9,
  month: 14,
  day: 30
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 9,
  month: 12,
  day: 32
}, { overflow: 'reject' }));
