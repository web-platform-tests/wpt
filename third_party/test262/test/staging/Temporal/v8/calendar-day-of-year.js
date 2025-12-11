// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-day-of-year test
  in V8's mjsunit test calendar-day-of-year.js
features: [Temporal]
---*/

assert.sameValue((new Temporal.PlainDate(1970, 1, 1)).dayOfYear, 1);
assert.sameValue((new Temporal.PlainDate(2000, 1, 1)).dayOfYear, 1);
assert.sameValue((new Temporal.PlainDate(2021, 1, 15)).dayOfYear, 15);
assert.sameValue((new Temporal.PlainDate(2020, 2, 15)).dayOfYear, 46);
assert.sameValue((new Temporal.PlainDate(2000, 2, 15)).dayOfYear, 46);
assert.sameValue((new Temporal.PlainDate(2020, 3, 15)).dayOfYear, 75);
assert.sameValue((new Temporal.PlainDate(2000, 3, 15)).dayOfYear, 75);
assert.sameValue((new Temporal.PlainDate(2001, 3, 15)).dayOfYear, 74);
assert.sameValue((new Temporal.PlainDate(2000, 12, 31)).dayOfYear, 366);
assert.sameValue((new Temporal.PlainDate(2001, 12, 31)).dayOfYear, 365);
assert.sameValue((new Temporal.PlainDateTime(1997, 1, 23, 5, 30, 13)).dayOfYear, 23);
assert.sameValue((new Temporal.PlainDateTime(1997, 2, 23, 5, 30, 13)).dayOfYear, 54);
assert.sameValue((new Temporal.PlainDateTime(1996, 3, 23, 5, 30, 13)).dayOfYear, 83);
assert.sameValue((new Temporal.PlainDateTime(1997, 3, 23, 5, 30, 13)).dayOfYear, 82);
assert.sameValue((new Temporal.PlainDateTime(1997, 12, 31, 5, 30, 13)).dayOfYear, 365);
assert.sameValue((new Temporal.PlainDateTime(1996, 12, 31, 5, 30, 13)).dayOfYear, 366);
assert.sameValue(Temporal.PlainDate.from('2019-01-18').dayOfYear, 18);
assert.sameValue(Temporal.PlainDate.from('2020-02-18').dayOfYear, 49);
assert.sameValue(Temporal.PlainDate.from('2019-12-31').dayOfYear, 365);
assert.sameValue(Temporal.PlainDate.from('2000-12-31').dayOfYear, 366);
