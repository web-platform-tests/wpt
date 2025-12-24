// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-to-plain-month-day test
  in V8's mjsunit test plain-date-to-plain-month-day.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.PlainDate(2021, 12, 11);
let badDateTime = { toPlainMonthDay: d1.toPlainMonthDay };
assert.throws(TypeError, () => badDateTime.toPlainMonthDay());
TemporalHelpers.assertPlainMonthDay(d1.toPlainMonthDay(), 'M12', 11);
