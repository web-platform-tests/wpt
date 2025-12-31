// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-month-code test
  in V8's mjsunit test calendar-month-code.js
features: [Temporal]
---*/

assert.sameValue((new Temporal.PlainDate(2021, 7, 15)).monthCode, 'M07');
assert.sameValue((new Temporal.PlainDateTime(1997, 8, 23, 5, 30, 13)).monthCode, 'M08');
assert.sameValue((new Temporal.PlainYearMonth(1999, 6)).monthCode, 'M06');
assert.sameValue((new Temporal.PlainMonthDay(2, 6)).monthCode, 'M02');
assert.sameValue(Temporal.PlainDate.from('2019-03-15').monthCode, 'M03');
