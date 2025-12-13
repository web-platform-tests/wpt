// Copyright (C) 2024 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.prototype.weekofyear
description: >
  Temporal.ZonedDateTime.prototype.weekOfYear returns undefined for all
  non-ISO calendars without a well-defined week numbering system.
features: [Temporal]
---*/

assert.sameValue(
  new Temporal.ZonedDateTime(1_704_112_496_987_654_321n, "UTC", "gregory").weekOfYear,
  undefined,
  "Gregorian calendar does not provide week numbers"
);

assert.sameValue(
  new Temporal.ZonedDateTime(1_704_112_496_987_654_321n, "UTC", "hebrew").weekOfYear,
  undefined,
  "Hebrew calendar does not provide week numbers"
);
