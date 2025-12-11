// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaindate.prototype.subtract
description: Constraining the day for 29/30-day months in islamic-tbla calendar
includes: [temporalHelpers.js]
features: [Temporal, Intl.Era-monthcode]
---*/

const calendar = "islamic-tbla";
const options = { overflow: "reject" };

// Years

// Months

const months1 = new Temporal.Duration(0, -1);
const months1n = new Temporal.Duration(0, 1);

const date1 = Temporal.PlainDate.from({ year: 1445, monthCode: "M01", day: 30, calendar }, options);
TemporalHelpers.assertPlainDate(
  date1.subtract(months1),
  1445, 2, "M02", 29, "Day is constrained when adding months to a 30-day month and landing in a 29-day month",
  "ah", 1445
);

assert.throws(RangeError, function () {
  date1.subtract(months1, options);
}, "Adding months to a 30-day month and landing in a 29-day month rejects");

TemporalHelpers.assertPlainDate(
  date1.subtract(months1n),
  1444, 12, "M12", 29, "Day is constrained when subtracting months from a 30-day month and landing in a 29-day month",
  "ah", 1444
);

assert.throws(RangeError, function () {
  date1.subtract(months1n, options);
}, "Subtracting months from a 30-day month and landing in a 29-day month rejects");
