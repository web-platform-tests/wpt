// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from instant-equals test
  in V8's mjsunit test instant-equals.js
features: [Temporal]
---*/

let inst1 = new Temporal.Instant(1234567890123456789n);
let inst2 = new Temporal.Instant(1234567890123456000n);
let inst3 = new Temporal.Instant(1234567890123456000n);
assert(!inst1.equals(inst2));
assert(inst2.equals(inst3));
let badInst = { equals: inst1.equals };
assert.throws(TypeError, () => badInst.equals(inst1));
