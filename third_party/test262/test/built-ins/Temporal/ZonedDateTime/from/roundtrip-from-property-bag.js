// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.from
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
  const dateFromYearMonth = Temporal.ZonedDateTime.from({ year, month: 1, day: 1, hour: 12, minute: 34, second: 56, millisecond: 987, microsecond: 654, nanosecond: 321, timeZone: "UTC" }, options);
  TemporalHelpers.assertPlainDateTime(
    dateFromYearMonth.toPlainDateTime(),
    year, 1, "M01", 1, 12, 34, 56, 987, 654, 321,
    `${dateFromYearMonth} - created from year and month`);

  const dateFromYearMonthCode = Temporal.ZonedDateTime.from({ year, monthCode: "M01", day: 1, hour: 12, minute: 34, second: 56, millisecond: 987, microsecond: 654, nanosecond: 321, timeZone: "UTC" }, options);
  TemporalHelpers.assertPlainDateTime(
    dateFromYearMonthCode.toPlainDateTime(),
    year, 1, "M01", 1, 12, 34, 56, 987, 654, 321,
    `${dateFromYearMonthCode} - created from year and month code`);
}
