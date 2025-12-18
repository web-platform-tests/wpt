// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-days-in-month test
  in V8's mjsunit test calendar-days-in-month.js
features: [Temporal]
---*/

assert.sameValue((new Temporal.PlainDate(2021, 1, 15)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDate(2020, 2, 15)).daysInMonth, 29);
assert.sameValue((new Temporal.PlainDate(2000, 2, 15)).daysInMonth, 29);
assert.sameValue((new Temporal.PlainDate(2021, 2, 15)).daysInMonth, 28);
assert.sameValue((new Temporal.PlainDate(2021, 3, 15)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDate(2021, 4, 15)).daysInMonth, 30);
assert.sameValue((new Temporal.PlainDate(2021, 5, 15)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDate(2021, 6, 15)).daysInMonth, 30);
assert.sameValue((new Temporal.PlainDate(2021, 7, 15)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDate(2021, 8, 15)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDate(2021, 9, 15)).daysInMonth, 30);
assert.sameValue((new Temporal.PlainDate(2021, 10, 15)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDate(2021, 11, 15)).daysInMonth, 30);
assert.sameValue((new Temporal.PlainDate(2021, 12, 15)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDateTime(1997, 1, 23, 5, 30, 13)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDateTime(1996, 2, 23, 5, 30, 13)).daysInMonth, 29);
assert.sameValue((new Temporal.PlainDateTime(2000, 2, 23, 5, 30, 13)).daysInMonth, 29);
assert.sameValue((new Temporal.PlainDateTime(1997, 2, 23, 5, 30, 13)).daysInMonth, 28);
assert.sameValue((new Temporal.PlainDateTime(1997, 3, 23, 5, 30, 13)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDateTime(1997, 4, 23, 5, 30, 13)).daysInMonth, 30);
assert.sameValue((new Temporal.PlainDateTime(1997, 5, 23, 5, 30, 13)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDateTime(1997, 6, 23, 5, 30, 13)).daysInMonth, 30);
assert.sameValue((new Temporal.PlainDateTime(1997, 7, 23, 5, 30, 13)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDateTime(1997, 8, 23, 5, 30, 13)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDateTime(1997, 9, 23, 5, 30, 13)).daysInMonth, 30);
assert.sameValue((new Temporal.PlainDateTime(1997, 10, 23, 5, 30, 13)).daysInMonth, 31);
assert.sameValue((new Temporal.PlainDateTime(1997, 11, 23, 5, 30, 13)).daysInMonth, 30);
assert.sameValue((new Temporal.PlainDateTime(1997, 12, 23, 5, 30, 13)).daysInMonth, 31);
assert.sameValue(Temporal.PlainDate.from('2019-01-18').daysInMonth, 31);
assert.sameValue(Temporal.PlainDate.from('2020-02-18').daysInMonth, 29);
assert.sameValue(Temporal.PlainDate.from('2019-02-18').daysInMonth, 28);
assert.sameValue(Temporal.PlainDate.from('2019-03-18').daysInMonth, 31);
assert.sameValue(Temporal.PlainDate.from('2019-04-18').daysInMonth, 30);
assert.sameValue(Temporal.PlainDate.from('2019-05-18').daysInMonth, 31);
assert.sameValue(Temporal.PlainDate.from('2019-06-18').daysInMonth, 30);
assert.sameValue(Temporal.PlainDate.from('2019-07-18').daysInMonth, 31);
assert.sameValue(Temporal.PlainDate.from('2019-08-18').daysInMonth, 31);
assert.sameValue(Temporal.PlainDate.from('2019-09-18').daysInMonth, 30);
assert.sameValue(Temporal.PlainDate.from('2019-10-18').daysInMonth, 31);
assert.sameValue(Temporal.PlainDate.from('2019-11-18').daysInMonth, 30);
assert.sameValue(Temporal.PlainDate.from('2019-12-18').daysInMonth, 31);
