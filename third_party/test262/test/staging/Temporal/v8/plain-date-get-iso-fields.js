// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-get-iso-fields test
  in V8's mjsunit test plain-date-get-iso-fields.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.PlainDate(1911, 10, 10);
TemporalHelpers.assertPlainDate(d1, 1911, 10, 'M10', 10);
let d2 = new Temporal.PlainDate(2020, 3, 12);
TemporalHelpers.assertPlainDate(d2, 2020, 3, 'M03', 12);
let d3 = new Temporal.PlainDate(1, 12, 25);
TemporalHelpers.assertPlainDate(d3, 1, 12, 'M12', 25);
let d4 = new Temporal.PlainDate(1970, 1, 1);
TemporalHelpers.assertPlainDate(d4, 1970, 1, 'M01', 1);
let d5 = new Temporal.PlainDate(-10, 12, 1);
TemporalHelpers.assertPlainDate(d5, -10, 12, 'M12', 1);
let d6 = new Temporal.PlainDate(-25406, 1, 1);
TemporalHelpers.assertPlainDate(d6, -25406, 1, 'M01', 1);
let d7 = new Temporal.PlainDate(26890, 12, 31);
TemporalHelpers.assertPlainDate(d7, 26890, 12, 'M12', 31);
