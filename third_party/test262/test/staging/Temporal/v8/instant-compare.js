// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from instant-compare test
  in V8's mjsunit test instant-compare.js
features: [Temporal]
---*/

let inst1 = new Temporal.Instant(1234567890123456789n);
let inst2 = new Temporal.Instant(1234567890123456000n);
let inst3 = new Temporal.Instant(1234567890123456000n);
assert.sameValue(Temporal.Instant.compare(inst2, inst3), 0);
assert.sameValue(Temporal.Instant.compare(inst1, inst2), 1);
assert.sameValue(Temporal.Instant.compare(inst3, inst1), -1);
assert.throws(RangeError, () => Temporal.Instant.compare(inst1, 'invalid iso8601 string'));
assert.throws(RangeError, () => Temporal.Instant.compare('invalid iso8601 string', inst1));
