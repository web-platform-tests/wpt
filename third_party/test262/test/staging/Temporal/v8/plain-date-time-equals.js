// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-time-equals test
  in V8's mjsunit test plain-date-time-equals.js
features: [Temporal]
---*/

let d1 = new Temporal.PlainDateTime(2021, 2, 28, 11, 12, 13);
let d2 = Temporal.PlainDateTime.from({
  year: 2021,
  month: 2,
  day: 28,
  hour: 11,
  minute: 12,
  second: 13
});
let d3 = Temporal.PlainDateTime.from({
  year: 2021,
  month: 2,
  day: 28,
  hour: 11,
  minute: 12,
  second: 13,
  nanosecond: 1
});
assert(d1.equals(d2));
assert(!d1.equals(d3));
assert(!d2.equals(d3));
let badDate = { equals: d1.equals };
assert.throws(TypeError, () => badDate.equals(d1));
