// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.prototype.subtract
description: Basic addition and subtraction in the islamic-tbla calendar
includes: [temporalHelpers.js]
features: [Temporal, Intl.Era-monthcode]
---*/

const calendar = "islamic-tbla";
const options = { overflow: "reject" };

// Years

// Months

const date1 = Temporal.ZonedDateTime.from({ year: 1445, monthCode: "M01", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options);
TemporalHelpers.assertPlainDateTime(
  date1.subtract(new Temporal.Duration(0, -8)).toPlainDateTime(),
  1445, 9, "M09", 1, 12, 34, 0, 0, 0, 0, "Adding 8 months to Muharram 1445 lands in Ramadan",
  "ah", 1445
);

TemporalHelpers.assertPlainDateTime(
  date1.subtract(new Temporal.Duration(0, -11)).toPlainDateTime(),
  1445, 12, "M12", 1, 12, 34, 0, 0, 0, 0, "Adding 11 months to Muharram 1445 lands in Dhu al-Hijjah",
  "ah", 1445
);

TemporalHelpers.assertPlainDateTime(
  date1.subtract(new Temporal.Duration(0, -12)).toPlainDateTime(),
  1446, 1, "M01", 1, 12, 34, 0, 0, 0, 0, "Adding 12 months to Muharram 1445 lands in Muharram 1446",
  "ah", 1446
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1445, monthCode: "M06", day: 15, hour: 12, minute: 34, timeZone: "UTC", calendar }).subtract(new Temporal.Duration(0, -13)).toPlainDateTime(),
  1446, 7, "M07", 15, 12, 34, 0, 0, 0, 0, "Adding 13 months to Jumada II 1445 lands in Rajab 1446",
  "ah", 1446
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1445, monthCode: "M03", day: 15, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(new Temporal.Duration(0, -6)).toPlainDateTime(),
  1445, 9, "M09", 15, 12, 34, 0, 0, 0, 0, "Adding 6 months to Rabi I 1445 lands in Ramadan",
  "ah", 1445
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1444, monthCode: "M10", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }).subtract(new Temporal.Duration(0, -5)).toPlainDateTime(),
  1445, 3, "M03", 1, 12, 34, 0, 0, 0, 0, "Adding 5 months to Shawwal 1444 crosses to 1445",
  "ah", 1445
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1400, monthCode: "M01", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }).subtract(new Temporal.Duration(0, -100)).toPlainDateTime(),
  1408, 5, "M05", 1, 12, 34, 0, 0, 0, 0, "Adding a large number of months",
  "ah", 1408
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1445, monthCode: "M09", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(new Temporal.Duration(0, 8)).toPlainDateTime(),
  1445, 1, "M01", 1, 12, 34, 0, 0, 0, 0, "Subtracting 8 months from Ramadan 1445 lands in Muharram",
  "ah", 1445
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1445, monthCode: "M06", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(new Temporal.Duration(0, 12)).toPlainDateTime(),
  1444, 6, "M06", 1, 12, 34, 0, 0, 0, 0, "Subtracting 12 months from Jumada II 1445 lands in Jumada II 1444",
  "ah", 1444
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 1445, monthCode: "M02", day: 15, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(new Temporal.Duration(0, 5)).toPlainDateTime(),
  1444, 9, "M09", 15, 12, 34, 0, 0, 0, 0, "Subtracting 5 months from Safar 1445 crosses to Ramadan 1444",
  "ah", 1444
);

// Weeks

// Days
