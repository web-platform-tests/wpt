// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-time-compare test
  in V8's mjsunit test plain-date-time-compare.js
features: [Temporal]
---*/

let t1 = new Temporal.PlainDateTime(2021, 3, 14, 1, 2, 3, 4, 5, 6);
let t2 = new Temporal.PlainDateTime(2021, 3, 14, 1, 2, 3, 4, 5, 6);
let t3 = t1;
let t4 = new Temporal.PlainDateTime(2021, 3, 15, 1, 2, 3, 4, 5, 6);
let t5 = new Temporal.PlainDateTime(2021, 4, 14, 1, 2, 3, 4, 5, 6);
let t6 = new Temporal.PlainDateTime(2022, 3, 14, 1, 2, 3, 4, 5, 6);
let t7 = new Temporal.PlainDateTime(2021, 3, 14, 1, 2, 3, 4, 5, 7);
assert.sameValue(Temporal.PlainDateTime.compare(t1, t1), 0);
assert.sameValue(Temporal.PlainDateTime.compare(t1, t2), 0);
assert.sameValue(Temporal.PlainDateTime.compare(t1, t3), 0);
assert.sameValue(Temporal.PlainDateTime.compare(t1, '2021-03-14T01:02:03'), 1);
assert.sameValue(Temporal.PlainDateTime.compare(t4, t1), 1);
assert.sameValue(Temporal.PlainDateTime.compare(t5, t1), 1);
assert.sameValue(Temporal.PlainDateTime.compare(t6, t1), 1);
assert.sameValue(Temporal.PlainDateTime.compare(t7, t1), 1);
assert.sameValue(Temporal.PlainDateTime.compare(t1, t4), -1);
assert.sameValue(Temporal.PlainDateTime.compare(t1, t5), -1);
assert.sameValue(Temporal.PlainDateTime.compare(t1, t6), -1);
assert.sameValue(Temporal.PlainDateTime.compare(t1, t7), -1);
assert.sameValue(Temporal.PlainDateTime.compare('2021-07-21', t1), 1);
assert.sameValue(Temporal.PlainDateTime.compare(t1, '2021-03-14T01:02:03.004005006'), 0);
assert.throws(RangeError, () => Temporal.PlainDateTime.compare(t1, 'invalid iso8601 string'));
assert.throws(RangeError, () => Temporal.PlainDateTime.compare('invalid iso8601 string', t1));
