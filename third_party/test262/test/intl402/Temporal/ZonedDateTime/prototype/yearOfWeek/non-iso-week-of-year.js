// Copyright (C) 2024 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.prototype.yearofweek
description: >
  Temporal.ZonedDateTime.prototype.yearOfWeek returns undefined for all
  non-ISO calendars without a well-defined week numbering system.
features: [Temporal]
---*/

assert.sameValue(
  new Temporal.ZonedDateTime(1_704_112_496_987_654_321n, "UTC", "gregory").yearOfWeek,
  undefined,
  "Gregorian calendar does not provide week numbers"
);

assert.sameValue(
  new Temporal.ZonedDateTime(1_704_112_496_987_654_321n, "UTC", "hebrew").yearOfWeek,
  undefined,
  "Hebrew calendar does not provide week numbers"
);
