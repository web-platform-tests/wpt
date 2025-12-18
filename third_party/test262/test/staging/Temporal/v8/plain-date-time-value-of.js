// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-time-valueOf test
  in V8's mjsunit test plain-date-time-valueOf.js
features: [Temporal]
---*/

let d1 = Temporal.Now.plainDateTimeISO();
assert.throws(TypeError, () => d1.valueOf());
