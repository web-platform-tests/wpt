// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-equals test
  in V8's mjsunit test plain-date-equals.js
features: [Temporal]
---*/

let d1 = new Temporal.PlainDate(2021, 2, 28);
let d2 = Temporal.PlainDate.from('2021-02-28');
let d3 = Temporal.PlainDate.from('2021-01-28');
assert(d1.equals(d2));
assert(!d1.equals(d3));
assert(!d2.equals(d3));
let badDate = { equals: d1.equals };
assert.throws(TypeError, () => badDate.equals(d1));
