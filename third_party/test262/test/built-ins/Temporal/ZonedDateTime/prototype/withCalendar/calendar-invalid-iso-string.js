// Copyright (C) 2025 Brage Hogstad, University of Bergen. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.prototype.withcalendar
description: >
  An ISO string that cannot be converted to a calendar ID should throw a RangeError
features: [Temporal]
---*/

const instance = new Temporal.ZonedDateTime(1_000_000_000_000_000_000n, "UTC", "iso8601");

const invalidStrings = [
  ["", "empty string"]
];

for (const [arg, description] of invalidStrings) {
  assert.throws(
    RangeError,
    () => instance.withCalendar(arg),
    `${description} is not a valid calendar ID`
  );
}
