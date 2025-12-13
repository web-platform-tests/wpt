// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-with test
  in V8's mjsunit test plain-date-with.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.PlainDate(1911, 10, 10);
TemporalHelpers.assertPlainDate(d1.with({ year: 2021 }), 2021, 10, 'M10', 10);
TemporalHelpers.assertPlainDate(d1.with({ month: 11 }), 1911, 11, 'M11', 10);
TemporalHelpers.assertPlainDate(d1.with({ monthCode: 'M05' }), 1911, 5, 'M05', 10);
TemporalHelpers.assertPlainDate(d1.with({ day: 30 }), 1911, 10, 'M10', 30);
TemporalHelpers.assertPlainDate(d1.with({
  year: 2021,
  hour: 30
}), 2021, 10, 'M10', 10);
TemporalHelpers.assertPlainDate(d1.with({
  month: 11,
  minute: 71
}), 1911, 11, 'M11', 10);
TemporalHelpers.assertPlainDate(d1.with({
  monthCode: 'M05',
  second: 90
}), 1911, 5, 'M05', 10);
TemporalHelpers.assertPlainDate(d1.with({
  day: 30,
  era: 'BC'
}), 1911, 10, 'M10', 30);

let d2 = new Temporal.PlainDate(2021, 7, 20, 'roc');
TemporalHelpers.assertPlainDate(d2, 110, 7, 'M07', 20, '', 'roc', 110);
TemporalHelpers.assertPlainDate(d2.with({ year: 1912 }), 1912, 7, 'M07', 20, '', 'roc', 1912);
TemporalHelpers.assertPlainDate(d2.with({ year: 1987 }), 1987, 7, 'M07', 20, '', 'roc', 1987);
assert.throws(TypeError, () => d1.with(new Temporal.PlainDate(2021, 7, 1)));
assert.throws(TypeError, () => d1.with(new Temporal.PlainDateTime(2021, 7, 1, 12, 13)));
assert.throws(TypeError, () => d1.with(new Temporal.PlainTime(1, 12, 13)));
assert.throws(TypeError, () => d1.with(new Temporal.PlainYearMonth(1991, 12)));
assert.throws(TypeError, () => d1.with(new Temporal.PlainMonthDay(5, 12)));
assert.throws(TypeError, () => d1.with('2012-05-13'));
assert.throws(TypeError, () => d1.with({ calendar: 'iso8601' }));
assert.throws(TypeError, () => d1.with({ timeZone: 'UTC' }));
assert.throws(TypeError, () => d1.with(true));
assert.throws(TypeError, () => d1.with(false));
assert.throws(TypeError, () => d1.with(NaN));
assert.throws(TypeError, () => d1.with(Infinity));
assert.throws(TypeError, () => d1.with(1234));
assert.throws(TypeError, () => d1.with(567n));
assert.throws(TypeError, () => d1.with(Symbol()));
assert.throws(TypeError, () => d1.with('string'));
assert.throws(TypeError, () => d1.with({}));
assert.throws(TypeError, () => d1.with([]));
let badDate = { with: d1.with };
assert.throws(TypeError, () => badDate.with({ day: 3 }));
