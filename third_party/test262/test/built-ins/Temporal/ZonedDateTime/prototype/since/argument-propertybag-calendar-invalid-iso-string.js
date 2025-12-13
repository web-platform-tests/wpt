// Copyright (C) 2025 Brage Hogstad, University of Bergen. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.prototype.since
description: >
  An ISO string that cannot be converted to a calendar ID should throw a RangeError
features: [Temporal]
---*/

const timeZone = "UTC";
const instance = new Temporal.ZonedDateTime(0n, timeZone);

const invalidStrings = [
  ["", "empty string"]
];

for (const [calendar, description] of invalidStrings) {
  const arg = { year: 2019, monthCode: "M11", day: 1, calendar };
  assert.throws(
    RangeError,
    () => instance.since(arg),
    `${description} is not a valid calendar ID`
  );
}
