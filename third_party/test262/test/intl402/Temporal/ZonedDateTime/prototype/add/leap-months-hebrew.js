// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.prototype.add
description: Arithmetic around leap months in the hebrew calendar
includes: [temporalHelpers.js]
features: [Temporal, Intl.Era-monthcode]
---*/

const calendar = "hebrew";
const options = { overflow: "reject" };

// Years

// Months

const months1 = new Temporal.Duration(0, 1);
const months1n = new Temporal.Duration(0, -1);
const months2 = new Temporal.Duration(0, 2);
const months2n = new Temporal.Duration(0, -2);

const date1 = Temporal.ZonedDateTime.from({ year: 5784, monthCode: "M04", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options);
TemporalHelpers.assertPlainDateTime(
  date1.add(months1).toPlainDateTime(),
  5784, 5, "M05", 1, 12, 34, 0, 0, 0, 0, "Adding 1 month to M04 in leap year lands in M05 (Shevat)",
  "am", 5784
);

TemporalHelpers.assertPlainDateTime(
  date1.add(months2).toPlainDateTime(),
  5784, 6, "M05L", 1, 12, 34, 0, 0, 0, 0, "Adding 2 months to M04 in leap year lands in M05L (Adar I)",
  "am", 5784
);

TemporalHelpers.assertPlainDateTime(
  date1.add(new Temporal.Duration(0, 3)).toPlainDateTime(),
  5784, 7, "M06", 1, 12, 34, 0, 0, 0, 0, "Adding 3 months to M04 in leap year lands in M06 (Adar II)",
  "am", 5784
);

const date2 = Temporal.ZonedDateTime.from({ year: 5784, monthCode: "M05L", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options);
TemporalHelpers.assertPlainDateTime(
  date2.add(months1).toPlainDateTime(),
  5784, 7, "M06", 1, 12, 34, 0, 0, 0, 0, "Adding 1 month to M05L (Adar I) lands in M06 (Adar II)",
  "am", 5784
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 5783, monthCode: "M04", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).add(months2).toPlainDateTime(),
  5783, 6, "M06", 1, 12, 34, 0, 0, 0, 0, "Adding 2 months to M04 in non-leap year lands in M06 (no M05L)",
  "am", 5783
);

const date3 = Temporal.ZonedDateTime.from({ year: 5784, monthCode: "M07", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options);
TemporalHelpers.assertPlainDateTime(
  date3.add(months1n).toPlainDateTime(),
  5784, 7, "M06", 1, 12, 34, 0, 0, 0, 0, "Subtracting 1 month from M07 in leap year lands in M06 (Adar II)",
  "am", 5784
);

TemporalHelpers.assertPlainDateTime(
  date3.add(months2n).toPlainDateTime(),
  5784, 6, "M05L", 1, 12, 34, 0, 0, 0, 0, "Subtracting 2 months from M07 in leap year lands in M05L (Adar I)",
  "am", 5784
);

TemporalHelpers.assertPlainDateTime(
  date3.add(new Temporal.Duration(0, -3)).toPlainDateTime(),
  5784, 5, "M05", 1, 12, 34, 0, 0, 0, 0, "Subtracting 3 months from M07 in leap year lands in M05 (Shevat)",
  "am", 5784
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 5784, monthCode: "M06", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }).add(months1n).toPlainDateTime(),
  5784, 6, "M05L", 1, 12, 34, 0, 0, 0, 0, "Subtracting 1 month from M06 (Adar II) in leap year lands in M05L (Adar I)",
  "am", 5784
);

TemporalHelpers.assertPlainDateTime(
  date2.add(months1n).toPlainDateTime(),
  5784, 5, "M05", 1, 12, 34, 0, 0, 0, 0, "Subtracting 1 month from M05L (Adar I) lands in M05 (Shevat)",
  "am", 5784
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 5783, monthCode: "M07", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }).add(months2n).toPlainDateTime(),
  5783, 5, "M05", 1, 12, 34, 0, 0, 0, 0, "Subtracting 2 months from M07 in non-leap year lands in M05 (no M05L)",
  "am", 5783
);

// Weeks

// Days

const days10 = new Temporal.Duration(0, 0, 0, /* days = */ 10);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 5784, monthCode: "M05L", day: 30, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).add(days10).toPlainDateTime(),
  5784, 7, "M06", 10, 12, 34, 0, 0, 0, 0, "add 10 days to leap day", "am", 5784
);
