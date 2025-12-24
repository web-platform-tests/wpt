// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-month test
  in V8's mjsunit test calendar-month.js
features: [Temporal]
---*/

assert.sameValue((new Temporal.PlainDate(2021, 7, 15)).month, 7);
assert.sameValue((new Temporal.PlainDateTime(1997, 8, 23, 5, 30, 13)).month, 8);
assert.sameValue((new Temporal.PlainYearMonth(1999, 6)).month, 6);
assert.sameValue(Temporal.PlainDate.from('2019-03-15').month, 3);
assert.sameValue((new Temporal.PlainMonthDay(3, 16)).month, undefined);
