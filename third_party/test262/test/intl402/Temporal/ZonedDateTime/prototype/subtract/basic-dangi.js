// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.prototype.subtract
description: Basic addition and subtraction in the dangi calendar
features: [Temporal, Intl.Era-monthcode]
includes: [temporalHelpers.js]
---*/

const calendar = "dangi";
const options = { overflow: "reject" };

// Years

// Months

const duration1 = new Temporal.Duration(0, -1);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 2019, monthCode: "M11", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(duration1).toPlainDateTime(),
  2019, 12, "M12", 1, 12, 34, 0, 0, 0, 0, "add 1 month, with result in same year"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 2019, monthCode: "M12", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(duration1).toPlainDateTime(),
  2020, 1, "M01", 1, 12, 34, 0, 0, 0, 0, "add 1 month, with result in next year"
);

// Weeks

const months2weeks3 = new Temporal.Duration(0, /* months = */ -2, /* weeks = */ -3);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 2021, monthCode: "M01", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(months2weeks3).toPlainDateTime(),
  2021, 3, "M03", 22, 12, 34, 0, 0, 0, 0, "add 2 months 3 weeks from non-leap day/month, ending in same year"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 2021, monthCode: "M12", day: 29, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(months2weeks3).toPlainDateTime(),
  2022, 3, "M03", 21, 12, 34, 0, 0, 0, 0, "add 2 months 3 weeks from end of year to next year"
);

// Days

const days10 = new Temporal.Duration(0, 0, 0, /* days = */ -10);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 2021, monthCode: "M01", day: 1, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(days10).toPlainDateTime(),
  2021, 1, "M01", 11, 12, 34, 0, 0, 0, 0, "add 10 days, ending in same month"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 2021, monthCode: "M01", day: 29, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(days10).toPlainDateTime(),
  2021, 2, "M02", 10, 12, 34, 0, 0, 0, 0, "add 10 days, ending in following month"
);

TemporalHelpers.assertPlainDateTime(
  Temporal.ZonedDateTime.from({ year: 2021, monthCode: "M12", day: 29, hour: 12, minute: 34, timeZone: "UTC", calendar }, options).subtract(days10).toPlainDateTime(),
  2022, 1, "M01", 10, 12, 34, 0, 0, 0, 0, "add 10 days, ending in following year"
);
