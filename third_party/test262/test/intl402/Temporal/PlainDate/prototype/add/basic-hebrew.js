// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaindate.prototype.add
description: Basic addition and subtraction in the hebrew calendar
features: [Temporal]
includes: [temporalHelpers.js]
---*/

const calendar = "hebrew";
const options = { overflow: "reject" };

// Years

// Months

// Weeks

// Days

const days10 = new Temporal.Duration(0, 0, 0, /* days = */ 10);

TemporalHelpers.assertPlainDate(
  Temporal.PlainDate.from({ year: 5785, monthCode: "M01", day: 1, calendar }, options).add(days10),
  5785, 1, "M01", 11, "adding 10 days", "am", 5785
);
