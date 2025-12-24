// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaindatetime.from
description: >
  Check that various dates created from a property bag have the expected
  properties
includes: [temporalHelpers.js]
features: [Temporal, Intl.Era-monthcode]
---*/

const options = { overflow: "reject" };

testRoundtrip(2000);
testRoundtrip(1);

function testRoundtrip(year) {
  const dateFromYearMonth = Temporal.PlainDateTime.from({ year, month: 1, day: 1, hour: 12, minute: 34, second: 56, millisecond: 987, microsecond: 654, nanosecond: 321 }, options);
  TemporalHelpers.assertPlainDateTime(
    dateFromYearMonth,
    year, 1, "M01", 1, 12, 34, 56, 987, 654, 321,
    `${dateFromYearMonth} - created from year and month`);

  const dateFromYearMonthCode = Temporal.PlainDateTime.from({ year, monthCode: "M01", day: 1, hour: 12, minute: 34, second: 56, millisecond: 987, microsecond: 654, nanosecond: 321 }, options);
  TemporalHelpers.assertPlainDateTime(
    dateFromYearMonthCode,
    year, 1, "M01", 1, 12, 34, 56, 987, 654, 321,
    `${dateFromYearMonthCode} - created from year and month code`);
}
