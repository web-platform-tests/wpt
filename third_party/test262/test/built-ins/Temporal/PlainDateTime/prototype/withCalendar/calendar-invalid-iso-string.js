// Copyright (C) 2025 Brage Hogstad, University of Bergen. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaindatetime.prototype.withcalendar
description: Invalid ISO 8601 string is not accepted as calendar
features: [Temporal]
---*/

const instance = new Temporal.PlainDateTime(1976, 11, 18, 15, 23, 30, 123, 456, 789, "iso8601");

const invalidStrings = [
  ["", "empty string"],
];

for (const [arg, description] of invalidStrings) {
  assert.throws(
    RangeError,
    () => instance.withCalendar(arg),
    `${description} is not a valid calendar ID`
  );
}
