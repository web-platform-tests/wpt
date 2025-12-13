// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.prototype.add
description: Constraining the day for 29/30-day months in islamic-civil calendar
includes: [temporalHelpers.js]
features: [Temporal, Intl.Era-monthcode]
---*/

const calendar = "islamic-civil";
const options = { overflow: "reject" };

// Years

// Months

const months1 = new Temporal.Duration(0, 1);
const months1n = new Temporal.Duration(0, -1);

const date1 = Temporal.ZonedDateTime.from({ year: 1445, monthCode: "M01", day: 30, hour: 12, minute: 34, timeZone: "UTC", calendar }, options);
TemporalHelpers.assertPlainDateTime(
  date1.add(months1).toPlainDateTime(),
  1445, 2, "M02", 29, 12, 34, 0, 0, 0, 0, "Day is constrained when adding months to a 30-day month and landing in a 29-day month",
  "ah", 1445
);

assert.throws(RangeError, function () {
  date1.add(months1, options);
}, "Adding months to a 30-day month and landing in a 29-day month rejects");

TemporalHelpers.assertPlainDateTime(
  date1.add(months1n).toPlainDateTime(),
  1444, 12, "M12", 29, 12, 34, 0, 0, 0, 0, "Day is constrained when subtracting months from a 30-day month and landing in a 29-day month",
  "ah", 1444
);

assert.throws(RangeError, function () {
  date1.add(months1n, options);
}, "Subtracting months from a 30-day month and landing in a 29-day month rejects");
