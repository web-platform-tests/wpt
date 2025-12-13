// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-months-in-year test
  in V8's mjsunit test calendar-months-in-year.js
features: [Temporal]
---*/

assert.sameValue((new Temporal.PlainDate(2021, 7, 15)).monthsInYear, 12);
assert.sameValue((new Temporal.PlainDate(1234, 7, 15)).monthsInYear, 12);
assert.sameValue((new Temporal.PlainDateTime(1997, 8, 23, 5, 30, 13)).monthsInYear, 12);
assert.sameValue((new Temporal.PlainDateTime(1234, 8, 23, 5, 30, 13)).monthsInYear, 12);
assert.sameValue(Temporal.PlainDate.from('2019-03-18').monthsInYear, 12);
assert.sameValue(Temporal.PlainDate.from('1234-03-18').monthsInYear, 12);
