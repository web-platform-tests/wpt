// Copyright (C) 2025 Brage Hogstad, University of Bergen. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.duration.prototype.total
description: Various invalid ISO string values for relativeTo.calendar
features: [Temporal]
---*/

const instance = new Temporal.Duration(1, 0, 0, 0, 24);

const invalidStrings = [
  ["", "empty string"],
];

for (const [calendar, description] of invalidStrings) {
  const relativeTo = { year: 2019, monthCode: "M11", day: 1, calendar };
  assert.throws(
    RangeError,
    () => instance.total({ unit: "days", relativeTo }),
    `${description} is not a valid calendar ID`
  );
}
