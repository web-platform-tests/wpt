// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-in-leap-year test
  in V8's mjsunit test calendar-in-leap-year.js
features: [Temporal]
---*/

assert.sameValue((new Temporal.PlainDate(1995, 7, 15)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDate(1996, 7, 15)).inLeapYear, true);
assert.sameValue((new Temporal.PlainDate(1997, 7, 15)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDate(1998, 7, 15)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDate(1999, 7, 15)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDate(2000, 7, 15)).inLeapYear, true);
assert.sameValue((new Temporal.PlainDate(2001, 7, 15)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDate(2002, 7, 15)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDate(2003, 7, 15)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDate(2004, 7, 15)).inLeapYear, true);
assert.sameValue((new Temporal.PlainDate(2005, 7, 15)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDateTime(1995, 8, 23, 5, 30, 13)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDateTime(1996, 8, 23, 5, 30, 13)).inLeapYear, true);
assert.sameValue((new Temporal.PlainDateTime(1997, 8, 23, 5, 30, 13)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDateTime(1998, 8, 23, 5, 30, 13)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDateTime(1999, 8, 23, 5, 30, 13)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDateTime(2000, 8, 23, 5, 30, 13)).inLeapYear, true);
assert.sameValue((new Temporal.PlainDateTime(2001, 8, 23, 5, 30, 13)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDateTime(2002, 8, 23, 5, 30, 13)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDateTime(2003, 8, 23, 5, 30, 13)).inLeapYear, false);
assert.sameValue((new Temporal.PlainDateTime(2004, 8, 23, 5, 30, 13)).inLeapYear, true);
assert.sameValue((new Temporal.PlainDateTime(2005, 8, 23, 5, 30, 13)).inLeapYear, false);
assert.sameValue(Temporal.PlainDate.from('2019-03-18').inLeapYear, false);
assert.sameValue(Temporal.PlainDate.from('2020-03-18').inLeapYear, true);
assert.sameValue(Temporal.PlainDate.from('2021-03-18').inLeapYear, false);
assert.sameValue(Temporal.PlainDate.from('2022-03-18').inLeapYear, false);
assert.sameValue(Temporal.PlainDate.from('2023-03-18').inLeapYear, false);
assert.sameValue(Temporal.PlainDate.from('2024-03-18').inLeapYear, true);
assert.sameValue(Temporal.PlainDate.from('2025-03-18').inLeapYear, false);
assert.sameValue(Temporal.PlainDate.from('2026-03-18').inLeapYear, false);
