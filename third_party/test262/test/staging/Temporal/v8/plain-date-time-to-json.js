// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-time-to-json test
  in V8's mjsunit test plain-date-time-to-json.js
features: [Temporal]
---*/

assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1).toJSON(), '2021-07-01T00:00:00');
assert.sameValue(new Temporal.PlainDateTime(9999, 12, 31).toJSON(), '9999-12-31T00:00:00');
assert.sameValue(new Temporal.PlainDateTime(1000, 1, 1).toJSON(), '1000-01-01T00:00:00');
assert.sameValue(new Temporal.PlainDateTime(10000, 1, 1).toJSON(), '+010000-01-01T00:00:00');
assert.sameValue(new Temporal.PlainDateTime(25021, 7, 1).toJSON(), '+025021-07-01T00:00:00');
assert.sameValue(new Temporal.PlainDateTime(999, 12, 31).toJSON(), '0999-12-31T00:00:00');
assert.sameValue(new Temporal.PlainDateTime(99, 8, 1).toJSON(), '0099-08-01T00:00:00');
assert.sameValue(new Temporal.PlainDateTime(-20, 9, 30).toJSON(), '-000020-09-30T00:00:00');
assert.sameValue(new Temporal.PlainDateTime(-2021, 7, 1).toJSON(), '-002021-07-01T00:00:00');
assert.sameValue(new Temporal.PlainDateTime(-22021, 7, 1).toJSON(), '-022021-07-01T00:00:00');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 2, 3, 4).toJSON(), '2021-07-01T02:03:04');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 3, 4).toJSON(), '2021-07-01T00:03:04');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 0, 4).toJSON(), '2021-07-01T00:00:04');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 0, 0).toJSON(), '2021-07-01T00:00:00');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 2, 0, 0).toJSON(), '2021-07-01T02:00:00');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 2, 3, 0).toJSON(), '2021-07-01T02:03:00');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 23, 59, 59).toJSON(), '2021-07-01T23:59:59');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59).toJSON(), '2021-07-01T00:59:59');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 0, 0, 1).toJSON(), '2021-07-01T00:59:59.000000001');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 0, 8, 9).toJSON(), '2021-07-01T00:59:59.000008009');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 7, 8, 9).toJSON(), '2021-07-01T00:59:59.007008009');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 0, 0, 90).toJSON(), '2021-07-01T00:59:59.00000009');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 0, 0, 900).toJSON(), '2021-07-01T00:59:59.0000009');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 0, 8).toJSON(), '2021-07-01T00:59:59.000008');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 0, 8, 0).toJSON(), '2021-07-01T00:59:59.000008');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 0, 80).toJSON(), '2021-07-01T00:59:59.00008');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 0, 80, 0).toJSON(), '2021-07-01T00:59:59.00008');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 0, 800).toJSON(), '2021-07-01T00:59:59.0008');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 0, 800, 0).toJSON(), '2021-07-01T00:59:59.0008');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 7, 0, 0).toJSON(), '2021-07-01T00:59:59.007');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 7, 0).toJSON(), '2021-07-01T00:59:59.007');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 7).toJSON(), '2021-07-01T00:59:59.007');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 70, 0, 0).toJSON(), '2021-07-01T00:59:59.07');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 70, 0).toJSON(), '2021-07-01T00:59:59.07');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 70).toJSON(), '2021-07-01T00:59:59.07');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 700, 0, 0).toJSON(), '2021-07-01T00:59:59.7');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 700, 0).toJSON(), '2021-07-01T00:59:59.7');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 700).toJSON(), '2021-07-01T00:59:59.7');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 0, 876).toJSON(), '2021-07-01T00:59:59.000876');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 876).toJSON(), '2021-07-01T00:59:59.876');
assert.sameValue(new Temporal.PlainDateTime(2021, 7, 1, 0, 59, 59, 0, 0, 876).toJSON(), '2021-07-01T00:59:59.000000876');
