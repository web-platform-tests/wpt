// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-compare test
  in V8's mjsunit test plain-date-compare.js
features: [Temporal]
---*/

let t1 = new Temporal.PlainDate(2021, 3, 14);
let t2 = new Temporal.PlainDate(2021, 3, 14);
let t3 = t1;
let t4 = new Temporal.PlainDate(2021, 3, 15);
let t5 = new Temporal.PlainDate(2021, 4, 14);
let t6 = new Temporal.PlainDate(2022, 3, 14);
assert.sameValue(Temporal.PlainDate.compare(t1, t1), 0);
assert.sameValue(Temporal.PlainDate.compare(t1, t2), 0);
assert.sameValue(Temporal.PlainDate.compare(t1, t3), 0);
assert.sameValue(Temporal.PlainDate.compare(t1, '2021-03-14'), 0);
assert.sameValue(Temporal.PlainDate.compare(t1, '2021-03-14T23:59:59'), 0);
assert.sameValue(Temporal.PlainDate.compare(t4, t1), 1);
assert.sameValue(Temporal.PlainDate.compare(t5, t1), 1);
assert.sameValue(Temporal.PlainDate.compare(t6, t1), 1);
assert.sameValue(Temporal.PlainDate.compare(t1, t4), -1);
assert.sameValue(Temporal.PlainDate.compare(t1, t5), -1);
assert.sameValue(Temporal.PlainDate.compare(t1, t6), -1);
assert.sameValue(Temporal.PlainDate.compare('2021-07-21', t1), 1);
assert.throws(RangeError, () => Temporal.PlainDate.compare(t1, 'invalid iso8601 string'));
assert.throws(RangeError, () => Temporal.PlainDate.compare('invalid iso8601 string', t1));
