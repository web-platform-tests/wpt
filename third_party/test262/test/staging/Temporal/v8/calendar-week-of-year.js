// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-week-of-year test
  in V8's mjsunit test calendar-week-of-year.js
features: [Temporal]
---*/

assert.sameValue((new Temporal.PlainDate(1977, 1, 1)).weekOfYear, 53);
assert.sameValue((new Temporal.PlainDate(1977, 1, 2)).weekOfYear, 53);
assert.sameValue((new Temporal.PlainDate(1977, 12, 31)).weekOfYear, 52);
assert.sameValue((new Temporal.PlainDate(1978, 1, 1)).weekOfYear, 52);
assert.sameValue((new Temporal.PlainDate(1978, 1, 2)).weekOfYear, 1);
assert.sameValue((new Temporal.PlainDate(1978, 12, 31)).weekOfYear, 52);
assert.sameValue((new Temporal.PlainDate(1979, 1, 1)).weekOfYear, 1);
assert.sameValue((new Temporal.PlainDate(1979, 12, 30)).weekOfYear, 52);
assert.sameValue((new Temporal.PlainDate(1979, 12, 31)).weekOfYear, 1);
assert.sameValue((new Temporal.PlainDate(1980, 1, 1)).weekOfYear, 1);
assert.sameValue((new Temporal.PlainDate(1980, 12, 28)).weekOfYear, 52);
assert.sameValue((new Temporal.PlainDate(1980, 12, 29)).weekOfYear, 1);
assert.sameValue((new Temporal.PlainDate(1980, 12, 30)).weekOfYear, 1);
assert.sameValue((new Temporal.PlainDate(1980, 12, 31)).weekOfYear, 1);
assert.sameValue((new Temporal.PlainDate(1981, 1, 1)).weekOfYear, 1);
assert.sameValue((new Temporal.PlainDate(1981, 12, 31)).weekOfYear, 53);
assert.sameValue((new Temporal.PlainDate(1982, 1, 1)).weekOfYear, 53);
assert.sameValue((new Temporal.PlainDate(1982, 1, 2)).weekOfYear, 53);
assert.sameValue((new Temporal.PlainDate(1982, 1, 3)).weekOfYear, 53);
assert.sameValue(Temporal.PlainDate.from('1977-01-01').weekOfYear, 53);
assert.sameValue(Temporal.PlainDate.from('1977-01-02').weekOfYear, 53);
assert.sameValue(Temporal.PlainDate.from('1977-12-31').weekOfYear, 52);
assert.sameValue(Temporal.PlainDate.from('1978-01-01').weekOfYear, 52);
assert.sameValue(Temporal.PlainDate.from('1978-01-02').weekOfYear, 1);
assert.sameValue(Temporal.PlainDate.from('1978-12-31').weekOfYear, 52);
assert.sameValue(Temporal.PlainDate.from('1979-01-01').weekOfYear, 1);
assert.sameValue(Temporal.PlainDate.from('1979-12-30').weekOfYear, 52);
assert.sameValue(Temporal.PlainDate.from('1979-12-31').weekOfYear, 1);
assert.sameValue(Temporal.PlainDate.from('1980-01-01').weekOfYear, 1);
assert.sameValue(Temporal.PlainDate.from('1980-12-28').weekOfYear, 52);
assert.sameValue(Temporal.PlainDate.from('1980-12-29').weekOfYear, 1);
assert.sameValue(Temporal.PlainDate.from('1980-12-30').weekOfYear, 1);
assert.sameValue(Temporal.PlainDate.from('1980-12-31').weekOfYear, 1);
assert.sameValue(Temporal.PlainDate.from('1981-01-01').weekOfYear, 1);
assert.sameValue(Temporal.PlainDate.from('1981-12-31').weekOfYear, 53);
assert.sameValue(Temporal.PlainDate.from('1982-01-01').weekOfYear, 53);
assert.sameValue(Temporal.PlainDate.from('1982-01-02').weekOfYear, 53);
assert.sameValue(Temporal.PlainDate.from('1982-01-03').weekOfYear, 53);
