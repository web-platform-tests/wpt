// Copyright (C) 2024 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaindatetime.prototype.weekofyear
description: >
  Temporal.PlainDateTime.prototype.weekOfYear returns undefined for all
  non-ISO calendars without a well-defined week numbering system.
features: [Temporal]
---*/

assert.sameValue(
  new Temporal.PlainDateTime(2024, 1, 1, 12, 34, 56, 987, 654, 321, "gregory").weekOfYear,
  undefined,
  "Gregorian calendar does not provide week numbers"
);

assert.sameValue(
  new Temporal.PlainDateTime(2024, 1, 1, 12, 34, 56, 987, 654, 321, "hebrew").weekOfYear,
  undefined,
  "Hebrew calendar does not provide week numbers"
);
