// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaindate.prototype.subtract
description: Arithmetic around leap months in the hebrew calendar
includes: [temporalHelpers.js]
features: [Temporal, Intl.Era-monthcode]
---*/

const calendar = "hebrew";
const options = { overflow: "reject" };

// Years

// Months

const months1 = new Temporal.Duration(0, -1);
const months1n = new Temporal.Duration(0, 1);
const months2 = new Temporal.Duration(0, -2);
const months2n = new Temporal.Duration(0, 2);

const date1 = Temporal.PlainDate.from({ year: 5784, monthCode: "M04", day: 1, calendar }, options);
TemporalHelpers.assertPlainDate(
  date1.subtract(months1),
  5784, 5, "M05", 1, "Adding 1 month to M04 in leap year lands in M05 (Shevat)",
  "am", 5784
);

TemporalHelpers.assertPlainDate(
  date1.subtract(months2),
  5784, 6, "M05L", 1, "Adding 2 months to M04 in leap year lands in M05L (Adar I)",
  "am", 5784
);

TemporalHelpers.assertPlainDate(
  date1.subtract(new Temporal.Duration(0, -3)),
  5784, 7, "M06", 1, "Adding 3 months to M04 in leap year lands in M06 (Adar II)",
  "am", 5784
);

const date2 = Temporal.PlainDate.from({ year: 5784, monthCode: "M05L", day: 1, calendar }, options);
TemporalHelpers.assertPlainDate(
  date2.subtract(months1),
  5784, 7, "M06", 1, "Adding 1 month to M05L (Adar I) lands in M06 (Adar II)",
  "am", 5784
);

TemporalHelpers.assertPlainDate(
  Temporal.PlainDate.from({ year: 5783, monthCode: "M04", day: 1, calendar }, options).subtract(months2),
  5783, 6, "M06", 1, "Adding 2 months to M04 in non-leap year lands in M06 (no M05L)",
  "am", 5783
);

const date3 = Temporal.PlainDate.from({ year: 5784, monthCode: "M07", day: 1, calendar }, options);
TemporalHelpers.assertPlainDate(
  date3.subtract(months1n),
  5784, 7, "M06", 1, "Subtracting 1 month from M07 in leap year lands in M06 (Adar II)",
  "am", 5784
);

TemporalHelpers.assertPlainDate(
  date3.subtract(months2n),
  5784, 6, "M05L", 1, "Subtracting 2 months from M07 in leap year lands in M05L (Adar I)",
  "am", 5784
);

TemporalHelpers.assertPlainDate(
  date3.subtract(new Temporal.Duration(0, 3)),
  5784, 5, "M05", 1, "Subtracting 3 months from M07 in leap year lands in M05 (Shevat)",
  "am", 5784
);

TemporalHelpers.assertPlainDate(
  Temporal.PlainDate.from({ year: 5784, monthCode: "M06", day: 1, calendar }).subtract(months1n),
  5784, 6, "M05L", 1, "Subtracting 1 month from M06 (Adar II) in leap year lands in M05L (Adar I)",
  "am", 5784
);

TemporalHelpers.assertPlainDate(
  date2.subtract(months1n),
  5784, 5, "M05", 1, "Subtracting 1 month from M05L (Adar I) lands in M05 (Shevat)",
  "am", 5784
);

TemporalHelpers.assertPlainDate(
  Temporal.PlainDate.from({ year: 5783, monthCode: "M07", day: 1, calendar }).subtract(months2n),
  5783, 5, "M05", 1, "Subtracting 2 months from M07 in non-leap year lands in M05 (no M05L)",
  "am", 5783
);

// Weeks

// Days

const days10 = new Temporal.Duration(0, 0, 0, /* days = */ -10);

TemporalHelpers.assertPlainDate(
  Temporal.PlainDate.from({ year: 5784, monthCode: "M05L", day: 30, calendar }, options).subtract(days10),
  5784, 7, "M06", 10, "add 10 days to leap day", "am", 5784
);
