// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from instant-to-json test
  in V8's mjsunit test instant-to-json.js
features: [Temporal]
---*/

assert.sameValue(Temporal.Instant.fromEpochMilliseconds(0).toJSON(), '1970-01-01T00:00:00Z');
let days_in_ms = 24 * 60 * 60 * 1000;
assert.sameValue(Temporal.Instant.fromEpochMilliseconds(365 * days_in_ms - 1).toJSON(), '1970-12-31T23:59:59.999Z');
assert.sameValue(Temporal.Instant.fromEpochMilliseconds(365 * days_in_ms).toJSON(), '1971-01-01T00:00:00Z');
assert.sameValue(Temporal.Instant.fromEpochMilliseconds(2 * 365 * days_in_ms - 1).toJSON(), '1971-12-31T23:59:59.999Z');
assert.sameValue(Temporal.Instant.fromEpochMilliseconds(2 * 365 * days_in_ms).toJSON(), '1972-01-01T00:00:00Z');
assert.sameValue(Temporal.Instant.fromEpochMilliseconds((2 * 365 + 58) * days_in_ms).toJSON(), '1972-02-28T00:00:00Z');
assert.sameValue(Temporal.Instant.fromEpochMilliseconds((2 * 365 + 59) * days_in_ms).toJSON(), '1972-02-29T00:00:00Z');
assert.sameValue(Temporal.Instant.fromEpochMilliseconds((15 * 365 + 4) * days_in_ms).toJSON(), '1985-01-01T00:00:00Z');
const year_in_sec = 24 * 60 * 60 * 365;
const number_of_random_test = 500;
for (let i = 0; i < number_of_random_test; i++) {
  let ms = Math.floor(Math.random() * year_in_sec * 1000 * 10000) - year_in_sec * 1000 * 5000;
  let d = new Date(ms);
  const dateout = d.toJSON().substr(0, 19);
  const temporalout = Temporal.Instant.fromEpochMilliseconds(ms).toJSON().substr(0, 19);
  if (dateout[0] != '0') {
    assert.sameValue(temporalout, dateout, ms);
  }
}
