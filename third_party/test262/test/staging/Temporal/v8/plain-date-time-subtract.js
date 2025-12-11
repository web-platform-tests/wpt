// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-time-subtract test
  in V8's mjsunit test plain-date-time-subtract.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 1, 2, 3, 4, 5, 6).subtract('-PT9H8M7.080090010S'), 2021, 7, 'M07', 20, 10, 10, 10, 84, 95, 16);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 0, 0, 0, 0, 1, 996).subtract('-PT0.0000071S'), 2021, 7, 'M07', 20, 0, 0, 0, 0, 9, 96);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 0, 0, 0, 1, 996).subtract('-PT0.0071S'), 2021, 7, 'M07', 20, 0, 0, 0, 9, 96, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 0, 0, 1, 996).subtract('-PT7.1S'), 2021, 7, 'M07', 20, 0, 0, 9, 96, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 0, 1, 59).subtract('-PT5M7S'), 2021, 7, 'M07', 20, 0, 7, 6, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 1, 59).subtract('-PT5H7M'), 2021, 7, 'M07', 20, 7, 6, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 19).subtract('-PT8H'), 2021, 7, 'M07', 21, 3, 0, 0, 0, 0, 0);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 21, 52, 53, 994, 995, 996).subtract('-PT5H13M11.404303202S'), 2021, 7, 'M07', 21, 3, 6, 5, 399, 299, 198);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 0, 0, 0, 0, 0, 995).subtract('-PT0.000000006S'), 2021, 7, 'M07', 20, 0, 0, 0, 0, 1, 1);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 0, 0, 0, 0, 0, 995).subtract('-PT0.00000006S'), 2021, 7, 'M07', 20, 0, 0, 0, 0, 1, 55);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 0, 0, 0, 0, 0, 995).subtract('-PT0.0000006S'), 2021, 7, 'M07', 20, 0, 0, 0, 0, 1, 595);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 1, 2, 3, 4, 5, 6).subtract('PT0.000000007S'), 2021, 7, 'M07', 20, 1, 2, 3, 4, 4, 999);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 1, 2, 3, 4, 5, 6).subtract('PT0.000005007S'), 2021, 7, 'M07', 20, 1, 2, 3, 3, 999, 999);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 1, 2, 3, 4, 5, 6).subtract('PT0.004005007S'), 2021, 7, 'M07', 20, 1, 2, 2, 999, 999, 999);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 1, 2, 3, 4, 5, 6).subtract('PT0.005006007S'), 2021, 7, 'M07', 20, 1, 2, 2, 998, 998, 999);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 1, 2, 3, 4, 5, 6).subtract('PT4.005006007S'), 2021, 7, 'M07', 20, 1, 1, 58, 998, 998, 999);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 1, 2, 3, 4, 5, 6).subtract('PT4S'), 2021, 7, 'M07', 20, 1, 1, 59, 4, 5, 6);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 1, 2, 3, 4, 5, 6).subtract('PT5M'), 2021, 7, 'M07', 20, 0, 57, 3, 4, 5, 6);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 1, 2, 3, 4, 5, 6).subtract('PT1H5M'), 2021, 7, 'M07', 19, 23, 57, 3, 4, 5, 6);
TemporalHelpers.assertPlainDateTime(new Temporal.PlainDateTime(2021, 7, 20, 1, 2, 3, 4, 5, 6).subtract('PT1H5M4S'), 2021, 7, 'M07', 19, 23, 56, 59, 4, 5, 6);
let goodDateTime = new Temporal.PlainDateTime(2021, 7, 20, 1, 2, 3);
let badDateTime = { subtract: goodDateTime.subtract };
assert.throws(TypeError, () => badDateTime.subtract('PT30M'));
assert.throws(RangeError, () => new Temporal.PlainDateTime(2021, 7, 20, 1, 2, 3).subtract('bad duration'));
