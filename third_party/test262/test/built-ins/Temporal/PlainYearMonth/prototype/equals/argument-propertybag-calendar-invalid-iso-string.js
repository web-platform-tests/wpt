// Copyright (C) 2025 Brage Hogstad, University of Bergen. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plainyearmonth.prototype.equals
description: >
  Appropriate error thrown when a calendar property from a property bag cannot
  be converted to a calendar ID
features: [BigInt, Symbol, Temporal]
---*/

const instance = new Temporal.PlainYearMonth(2000, 5);

const primitiveTests = [
  ["", "empty string"]
];

for (const [calendar, description] of primitiveTests) {
  const arg = { year: 2019, monthCode: "M11", day: 1, calendar };
  assert.throws(
    RangeError,
    () => instance.equals(arg),
    `${description} does not convert to a valid ISO string`
  );
}
