// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.prototype.subtract
description: Arithmetic around leap months in the chinese calendar
features: [Temporal, Intl.Era-monthcode]
includes: [temporalHelpers.js]
---*/

const calendar = "chinese";
const options = { overflow: "reject" };

// Years

const years1 = new Temporal.Duration(-1);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 2019, monthCode: "M01", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(years1).toPlainDateTime(),
  2020, 1, "M01", 1, 12, 34, 0, 0, 0, 0, "add 1 year from non-leap day"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1966, monthCode: "M03L", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(years1).toPlainDateTime(),
  1967, 3, "M03", 1, 12, 34, 0, 0, 0, 0, "add 1 year from leap month"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1938, monthCode: "M07L", day: 30, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(years1).toPlainDateTime(),
  1939, 7, "M07", 29, 12, 34, 0, 0, 0, 0, "add 1 year from leap day in leap month"
);

// Months

const months1 = new Temporal.Duration(0, -1);
const months1n = new Temporal.Duration(0, 1);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1947, monthCode: "M02L", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(months1).toPlainDateTime(),
  1947, 4, "M03", 1, 12, 34, 0, 0, 0, 0, "add 1 month, starting at start of leap month"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1955, monthCode: "M03L", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(months1).toPlainDateTime(),
  1955, 5, "M04", 1, 12, 34, 0, 0, 0, 0, "add 1 month, starting at start of leap month with 30 days"
);

const date1 = Temporal.ZonedDateTime.from({ year: 2020, monthCode: "M03", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options);
TemporalHelpers.assertPlainDateTime(
  date1.subtract(months1).toPlainDateTime(),
  2020, 4, "M04", 1, 12, 34, 0, 0, 0, 0, "adding 1 month to M03 in leap year lands in M04 (not M04L)"
);

TemporalHelpers.assertPlainDateTime(
  date1.subtract(new Temporal.Duration(0, -2)).toPlainDateTime(),
  2020, 5, "M04L", 1, 12, 34, 0, 0, 0, 0, "adding 2 months to M03 in leap year lands in M04L (leap month)"
);

TemporalHelpers.assertPlainDateTime(
  date1.subtract(new Temporal.Duration(0, -3)).toPlainDateTime(),
  2020, 6, "M05", 1, 12, 34, 0, 0, 0, 0, "adding 3 months to M03 in leap year lands in M05 (not M06)"
);

const date2 = Temporal.ZonedDateTime.from({ year: 2020, monthCode: "M06", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options);
TemporalHelpers.assertPlainDateTime(
  date2.subtract(months1n).toPlainDateTime(),
  2020, 6, "M05", 1, 12, 34, 0, 0, 0, 0, "Subtracting 1 month from M06 in leap year lands in M05"
);

TemporalHelpers.assertPlainDateTime(
  date2.subtract(new Temporal.Duration(0, 2)).toPlainDateTime(),
  2020, 5, "M04L", 1, 12, 34, 0, 0, 0, 0, "Subtracting 2 months from M06 in leap year lands in M04L (leap month)"
);

TemporalHelpers.assertPlainDateTime(
  date2.subtract(new Temporal.Duration(0, 3)).toPlainDateTime(),
  2020, 4, "M04", 1, 12, 34, 0, 0, 0, 0, "Subtracting 3 months from M06 in leap year lands in M04 (not M03)"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 2020, monthCode: "M05", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(months1n).toPlainDateTime(),
  2020, 5, "M04L", 1, 12, 34, 0, 0, 0, 0, "Subtracting 1 month from M05 in leap year lands in M04L"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 2020, monthCode: "M04L", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(months1n).toPlainDateTime(),
  2020, 4, "M04", 1, 12, 34, 0, 0, 0, 0, "Subtracting 1 month from M04L in calendar lands in M04"
);

// Weeks

const months2weeks3 = new Temporal.Duration(0, /* months = */ -2, /* weeks = */ -3);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1947, monthCode: "M02L", day: 29, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(months2weeks3).toPlainDateTime(),
  1947, 6, "M05", 20, 12, 34, 0, 0, 0, 0, "add 2 months 3 weeks from last day leap month without leap day"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1955, monthCode: "M03L", day: 30, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(months2weeks3).toPlainDateTime(),
  1955, 7, "M06", 21, 12, 34, 0, 0, 0, 0, "add 2 months 3 weeks from leap day in leap month"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1947, monthCode: "M01", day: 29, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(months2weeks3).toPlainDateTime(),
  1947, 4, "M03", 21, 12, 34, 0, 0, 0, 0, "add 2 months 3 weeks from immediately before a leap month"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1955, monthCode: "M06", day: 29, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(months2weeks3).toPlainDateTime(),
  1955, 10, "M09", 20, 12, 34, 0, 0, 0, 0, "add 2 months 3 weeks from immediately before a leap month"
);

// Days

const days10 = new Temporal.Duration(0, 0, 0, /* days = */ -10);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1955, monthCode: "M03L", day: 30, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(days10).toPlainDateTime(),
  1955, 5, "M04", 10, 12, 34, 0, 0, 0, 0, "add 10 days from leap day in leap month"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1947, monthCode: "M02L", day: 29, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(days10).toPlainDateTime(),
  1947, 4, "M03", 10, 12, 34, 0, 0, 0, 0, "add 10 days from last day of leap month"
);
