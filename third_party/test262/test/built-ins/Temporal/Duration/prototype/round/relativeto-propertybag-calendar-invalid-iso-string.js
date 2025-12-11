// Copyright (C) 2025 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.duration.prototype.round
description: >
  An ISO string that cannot be converted to a calendar ID should throw a RangeError
features: [Temporal]
---*/

const instance = new Temporal.Duration(1, 0, 0, 0, 24);

const invalidStrings = [
  ["", "empty string"]
];

for (const [calendar, description] of invalidStrings) {
  const relativeTo = { year: 2019, monthCode: "M11", day: 1, calendar };
  assert.throws(
    RangeError,
    () => instance.round({ largestUnit: "years", relativeTo }),
    `${description} is not a valid calendar ID`
  );
}
