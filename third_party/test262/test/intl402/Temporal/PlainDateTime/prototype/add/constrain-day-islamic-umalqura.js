// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaindatetime.prototype.add
description: Constraining the day for 29/30-day months in islamic-umalqura calendar
includes: [temporalHelpers.js]
features: [Temporal, Intl.Era-monthcode]
---*/

const calendar = "islamic-umalqura";
const options = { overflow: "reject" };

// Years

// Months

const months1 = new Temporal.Duration(0, /* months = */ 1);
const months1n = new Temporal.Duration(0, -1);

const date1 = Temporal.PlainDateTime.from({ year: 1447, monthCode: "M01", day: 30, hour: 12, minute: 34, calendar }, options);
TemporalHelpers.assertPlainDateTime(
  date1.add(months1),
  1447, 2, "M02", 29, 12, 34, 0, 0, 0, 0, "Day is constrained when adding months to a 30-day month and landing in a 29-day month",
  "ah", 1447
);

assert.throws(RangeError, function () {
  date1.add(months1, options);
}, "Adding months to a 30-day month and landing in a 29-day month rejects");

TemporalHelpers.assertPlainDateTime(
  date1.add(months1n),
  1446, 12, "M12", 29, 12, 34, 0, 0, 0, 0, "Day is constrained when subtracting months from a 30-day month and landing in a 29-day month",
  "ah", 1446
);

assert.throws(RangeError, function () {
  date1.add(months1n, options);
}, "Subtracting months from a 30-day month and landing in a 29-day month rejects");
