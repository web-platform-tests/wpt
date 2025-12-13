// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-add test
  in V8's mjsunit test plain-date-add.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d = new Temporal.PlainDate(2021, 7, 20);
TemporalHelpers.assertPlainDate(d.add('P1D'), 2021, 7, 'M07', 21);
TemporalHelpers.assertPlainDate(d.subtract('-P1D'), 2021, 7, 'M07', 21);
TemporalHelpers.assertPlainDate(d.add('-P1D'), 2021, 7, 'M07', 19);
TemporalHelpers.assertPlainDate(d.subtract('P1D'), 2021, 7, 'M07', 19);
TemporalHelpers.assertPlainDate(d.add('P11D'), 2021, 7, 'M07', 31);
TemporalHelpers.assertPlainDate(d.subtract('-P11D'), 2021, 7, 'M07', 31);
TemporalHelpers.assertPlainDate(d.add('P12D'), 2021, 8, 'M08', 1);
TemporalHelpers.assertPlainDate(d.subtract('-P12D'), 2021, 8, 'M08', 1);
let goodDate = new Temporal.PlainDate(2021, 7, 20);
let badDate = { add: goodDate.add };
assert.throws(TypeError, () => badDate.add('P1D'));
assert.throws(RangeError, () => new Temporal.PlainDate(2021, 7, 20).add('bad duration'));
