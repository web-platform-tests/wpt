// Copyright (C) 2024 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaindate.prototype.weekofyear
description: >
  Temporal.PlainDate.prototype.weekOfYear returns undefined for all
  non-ISO calendars without a well-defined week numbering system.
features: [Temporal, Intl.Era-monthcode]
---*/

assert.sameValue(
  new Temporal.PlainDate(2024, 1, 1, "gregory").weekOfYear,
  undefined,
  "Gregorian calendar does not provide week numbers"
);

assert.sameValue(
  new Temporal.PlainDate(2024, 1, 1, "hebrew").weekOfYear,
  undefined,
  "Hebrew calendar does not provide week numbers"
);
