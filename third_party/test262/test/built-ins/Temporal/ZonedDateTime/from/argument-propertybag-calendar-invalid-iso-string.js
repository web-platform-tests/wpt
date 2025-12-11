// Copyright (C) 2025 Brage Hogstad, University of Bergen. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.from
description: Various invalid ISO string values for calendar in a property bag
features: [Temporal]
---*/

const timeZone = "UTC";

const invalidStrings = [
  ["", "empty string"],
];

for (const [calendar, description] of invalidStrings) {
  const arg = { year: 1970, monthCode: "M01", day: 1, timeZone, calendar };
  assert.throws(
    RangeError,
    () => Temporal.ZonedDateTime.from(arg),
    `${description} is not a valid calendar ID`
  );
}
