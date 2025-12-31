// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-time-with test
  in V8's mjsunit test plain-date-time-with.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.PlainDateTime(1911, 11, 10, 4, 5, 6, 7, 8, 9);
let badDate = { with: d1.with };
assert.throws(TypeError, () => badDate.with());
assert.throws(TypeError, () => d1.with(null));
assert.throws(TypeError, () => d1.with(undefined));
assert.throws(TypeError, () => d1.with('string is invalid'));
assert.throws(TypeError, () => d1.with(true));
assert.throws(TypeError, () => d1.with(false));
assert.throws(TypeError, () => d1.with(NaN));
assert.throws(TypeError, () => d1.with(Infinity));
assert.throws(TypeError, () => d1.with(123));
assert.throws(TypeError, () => d1.with(456n));
assert.throws(TypeError, () => d1.with(Symbol()));
let date = Temporal.Now.plainDateISO();
assert.throws(TypeError, () => d1.with(date));
let dateTime = Temporal.Now.plainDateTimeISO();
assert.throws(TypeError, () => d1.with(dateTime));
let time = Temporal.Now.plainTimeISO();
assert.throws(TypeError, () => d1.with(time));
let ym = new Temporal.PlainYearMonth(2021, 7);
assert.throws(TypeError, () => d1.with(ym));
let md = new Temporal.PlainMonthDay(12, 25);
assert.throws(TypeError, () => d1.with(md));
assert.throws(TypeError, () => d1.with({ calendar: 'iso8601' }));
assert.throws(TypeError, () => d1.with({ timeZone: 'UTC' }));
assert.throws(TypeError, () => d1.with({ day: 3 }, null));
assert.throws(TypeError, () => d1.with({ day: 3 }, 'string is invalid'));
assert.throws(TypeError, () => d1.with({ day: 3 }, true));
assert.throws(TypeError, () => d1.with({ day: 3 }, false));
assert.throws(TypeError, () => d1.with({ day: 3 }, 123));
assert.throws(TypeError, () => d1.with({ day: 3 }, 456n));
assert.throws(TypeError, () => d1.with({ day: 3 }, Symbol()));
assert.throws(TypeError, () => d1.with({ day: 3 }, NaN));
assert.throws(TypeError, () => d1.with({ day: 3 }, Infinity));
TemporalHelpers.assertPlainDateTime(d1.with({ year: 2021 }), 2021, 11, 'M11', 10, 4, 5, 6, 7, 8, 9);
TemporalHelpers.assertPlainDateTime(d1.with({ month: 3 }), 1911, 3, 'M03', 10, 4, 5, 6, 7, 8, 9);
TemporalHelpers.assertPlainDateTime(d1.with({ monthCode: 'M05' }), 1911, 5, 'M05', 10, 4, 5, 6, 7, 8, 9);
TemporalHelpers.assertPlainDateTime(d1.with({ day: 1 }), 1911, 11, 'M11', 1, 4, 5, 6, 7, 8, 9);
TemporalHelpers.assertPlainDateTime(d1.with({ hour: 2 }), 1911, 11, 'M11', 10, 2, 5, 6, 7, 8, 9);
TemporalHelpers.assertPlainDateTime(d1.with({ minute: 3 }), 1911, 11, 'M11', 10, 4, 3, 6, 7, 8, 9);
TemporalHelpers.assertPlainDateTime(d1.with({ second: 4 }), 1911, 11, 'M11', 10, 4, 5, 4, 7, 8, 9);
TemporalHelpers.assertPlainDateTime(d1.with({ millisecond: 5 }), 1911, 11, 'M11', 10, 4, 5, 6, 5, 8, 9);
TemporalHelpers.assertPlainDateTime(d1.with({ microsecond: 6 }), 1911, 11, 'M11', 10, 4, 5, 6, 7, 6, 9);
TemporalHelpers.assertPlainDateTime(d1.with({ nanosecond: 7 }), 1911, 11, 'M11', 10, 4, 5, 6, 7, 8, 7);
