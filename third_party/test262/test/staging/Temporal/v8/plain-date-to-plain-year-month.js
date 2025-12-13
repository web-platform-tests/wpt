// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-to-plain-year-month test
  in V8's mjsunit test plain-date-to-plain-year-month.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.PlainDate(2021, 12, 11);
let badDate = { toPlainYearMonth: d1.toPlainYearMonth };
assert.throws(TypeError, () => badDate.toPlainYearMonth());
TemporalHelpers.assertPlainYearMonth(d1.toPlainYearMonth(), 2021, 12, 'M12');
