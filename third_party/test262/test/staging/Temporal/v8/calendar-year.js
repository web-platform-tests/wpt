// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-year test
  in V8's mjsunit test calendar-year.js
features: [Temporal]
---*/

assert.sameValue((new Temporal.PlainDate(2021, 7, 15)).year, 2021);
assert.sameValue((new Temporal.PlainDateTime(1997, 8, 23, 5, 30, 13)).year, 1997);
assert.sameValue((new Temporal.PlainYearMonth(1999, 6)).year, 1999);
assert.sameValue(Temporal.PlainDate.from('2019-03-15').year, 2019);
