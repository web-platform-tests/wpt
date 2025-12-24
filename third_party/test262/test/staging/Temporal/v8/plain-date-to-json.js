// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-to-json test
  in V8's mjsunit test plain-date-to-json.js
features: [Temporal]
---*/

assert.sameValue(new Temporal.PlainDate(2021, 7, 1).toJSON(), '2021-07-01');
assert.sameValue(new Temporal.PlainDate(9999, 12, 31).toJSON(), '9999-12-31');
assert.sameValue(new Temporal.PlainDate(1000, 1, 1).toJSON(), '1000-01-01');
assert.sameValue(new Temporal.PlainDate(99, 8, 1).toJSON(), '0099-08-01');
assert.sameValue(new Temporal.PlainDate(999, 12, 31).toJSON(), '0999-12-31');
assert.sameValue(new Temporal.PlainDate(10000, 1, 1).toJSON(), '+010000-01-01');
assert.sameValue(new Temporal.PlainDate(25021, 7, 1).toJSON(), '+025021-07-01');
assert.sameValue(new Temporal.PlainDate(-20, 9, 30).toJSON(), '-000020-09-30');
assert.sameValue(new Temporal.PlainDate(-2021, 7, 1).toJSON(), '-002021-07-01');
assert.sameValue(new Temporal.PlainDate(-22021, 7, 1).toJSON(), '-022021-07-01');
