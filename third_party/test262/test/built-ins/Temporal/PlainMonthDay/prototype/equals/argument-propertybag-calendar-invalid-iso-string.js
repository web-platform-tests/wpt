// Copyright (C) 2025 Brage Hogstad, University of Bergen. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plainmonthday.prototype.equals
description: >
  A string value for calendar in a property bag that is not a valid calendar ID
features: [Temporal]
---*/

const instance = new Temporal.PlainMonthDay(5, 2);

const invalidStrings = [
  ["", "empty string"],
];

for (const [calendar, description] of invalidStrings) {
  const arg = { year: 2019, monthCode: "M11", day: 1, calendar };
  assert.throws(
    RangeError,
    () => instance.equals(arg),
    `${description} is not a valid calendar ID`
  );
}
