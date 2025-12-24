// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-day test
  in V8's mjsunit test calendar-day.js
features: [Temporal]
---*/

assert.sameValue((new Temporal.PlainDate(2021, 7, 15)).day, 15);
assert.sameValue((new Temporal.PlainDateTime(1997, 8, 23, 5, 30, 13)).day, 23);
assert.sameValue((new Temporal.PlainMonthDay(2, 6)).day, 6);
assert.sameValue(Temporal.PlainDate.from('2019-03-18').day, 18);
