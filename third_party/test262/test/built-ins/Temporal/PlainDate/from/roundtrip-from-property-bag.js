// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaindate.from
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
  const dateFromYearMonth = Temporal.PlainDate.from({ year, month: 1, day: 1 }, options);
  TemporalHelpers.assertPlainDate(
    dateFromYearMonth,
    year, 1, "M01", 1,
    `${dateFromYearMonth} - created from year and month`);

  const dateFromYearMonthCode = Temporal.PlainDate.from({ year, monthCode: "M01", day: 1 }, options);
  TemporalHelpers.assertPlainDate(
    dateFromYearMonthCode,
    year, 1, "M01", 1,
    `${dateFromYearMonthCode} - created from year and month code`);
}
