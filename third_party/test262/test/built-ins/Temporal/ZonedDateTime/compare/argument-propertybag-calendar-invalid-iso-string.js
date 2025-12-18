// Copyright (C) 2025 Brage Hogstad, University of Bergen. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.compare
description: Invalid ISO string as calendar should throw RangeError
features: [Temporal]
---*/

const datetime = new Temporal.ZonedDateTime(0n, "UTC");

const invalidStrings = [
  ["", "empty string"],
];

for (const [calendar, description] of invalidStrings) {
  const arg = { year: 1970, monthCode: "M01", day: 1, calendar, timeZone: "UTC" };
  assert.throws(
    RangeError,
    () => Temporal.ZonedDateTime.compare(arg, datetime),
    `${description} is not a valid calendar ID (first argument)`
  );
  assert.throws(
    RangeError,
    () => Temporal.ZonedDateTime.compare(datetime, arg),
    `${description} is not a valid calendar ID (second argument)`
  );
}
