// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-date-add test
  in V8's mjsunit test calendar-date-add.js
features: [Temporal]
---*/

let p1y = new Temporal.Duration(1);
let p4y = new Temporal.Duration(4);
let p5m = new Temporal.Duration(0, 5);
let p1y2m = new Temporal.Duration(1, 2);
let p1y4d = new Temporal.Duration(1, 0, 0, 4);
let p1y2m4d = new Temporal.Duration(1, 2, 0, 4);
let p10d = new Temporal.Duration(0, 0, 0, 10);
let p1w = new Temporal.Duration(0, 0, 1);
let p6w = new Temporal.Duration(0, 0, 6);
let p2w3d = new Temporal.Duration(0, 0, 2, 3);
let p1y2w = new Temporal.Duration(1, 0, 2);
let p2m3w = new Temporal.Duration(0, 2, 3);
assert.sameValue(Temporal.PlainDate.from('2020-02-29').add(p1y).toJSON(), '2021-02-28');
assert.sameValue(Temporal.PlainDate.from('2020-02-29').add(p4y).toJSON(), '2024-02-29');
assert.sameValue(Temporal.PlainDate.from('2021-07-16').add(p1y).toJSON(), '2022-07-16');
assert.sameValue(Temporal.PlainDate.from('2021-07-16').add(p5m).toJSON(), '2021-12-16');
assert.sameValue(Temporal.PlainDate.from('2021-08-16').add(p5m).toJSON(), '2022-01-16');
assert.sameValue(Temporal.PlainDate.from('2021-10-31').add(p5m).toJSON(), '2022-03-31');
assert.sameValue(Temporal.PlainDate.from('2021-09-30').add(p5m).toJSON(), '2022-02-28');
assert.sameValue(Temporal.PlainDate.from('2019-09-30').add(p5m).toJSON(), '2020-02-29');
assert.sameValue(Temporal.PlainDate.from('2019-10-01').add(p5m).toJSON(), '2020-03-01');
assert.sameValue(Temporal.PlainDate.from('2021-07-16').add(p1y2m).toJSON(), '2022-09-16');
assert.sameValue(Temporal.PlainDate.from('2021-11-30').add(p1y2m).toJSON(), '2023-01-30');
assert.sameValue(Temporal.PlainDate.from('2021-12-31').add(p1y2m).toJSON(), '2023-02-28');
assert.sameValue(Temporal.PlainDate.from('2022-12-31').add(p1y2m).toJSON(), '2024-02-29');
assert.sameValue(Temporal.PlainDate.from('2021-07-16').add(p1y4d).toJSON(), '2022-07-20');
assert.sameValue(Temporal.PlainDate.from('2021-02-27').add(p1y4d).toJSON(), '2022-03-03');
assert.sameValue(Temporal.PlainDate.from('2023-02-27').add(p1y4d).toJSON(), '2024-03-02');
assert.sameValue(Temporal.PlainDate.from('2021-12-30').add(p1y4d).toJSON(), '2023-01-03');
assert.sameValue(Temporal.PlainDate.from('2021-07-30').add(p1y4d).toJSON(), '2022-08-03');
assert.sameValue(Temporal.PlainDate.from('2021-06-30').add(p1y4d).toJSON(), '2022-07-04');
assert.sameValue(Temporal.PlainDate.from('2021-07-16').add(p1y2m4d).toJSON(), '2022-09-20');
assert.sameValue(Temporal.PlainDate.from('2021-02-27').add(p1y2m4d).toJSON(), '2022-05-01');
assert.sameValue(Temporal.PlainDate.from('2021-02-26').add(p1y2m4d).toJSON(), '2022-04-30');
assert.sameValue(Temporal.PlainDate.from('2023-02-26').add(p1y2m4d).toJSON(), '2024-04-30');
assert.sameValue(Temporal.PlainDate.from('2021-12-30').add(p1y2m4d).toJSON(), '2023-03-04');
assert.sameValue(Temporal.PlainDate.from('2021-07-30').add(p1y2m4d).toJSON(), '2022-10-04');
assert.sameValue(Temporal.PlainDate.from('2021-06-30').add(p1y2m4d).toJSON(), '2022-09-03');
assert.sameValue(Temporal.PlainDate.from('2021-07-16').add(p10d).toJSON(), '2021-07-26');
assert.sameValue(Temporal.PlainDate.from('2021-07-26').add(p10d).toJSON(), '2021-08-05');
assert.sameValue(Temporal.PlainDate.from('2021-12-26').add(p10d).toJSON(), '2022-01-05');
assert.sameValue(Temporal.PlainDate.from('2020-02-26').add(p10d).toJSON(), '2020-03-07');
assert.sameValue(Temporal.PlainDate.from('2021-02-26').add(p10d).toJSON(), '2021-03-08');
assert.sameValue(Temporal.PlainDate.from('2020-02-19').add(p10d).toJSON(), '2020-02-29');
assert.sameValue(Temporal.PlainDate.from('2021-02-19').add(p10d).toJSON(), '2021-03-01');
assert.sameValue(Temporal.PlainDate.from('2021-02-19').add(p1w).toJSON(), '2021-02-26');
assert.sameValue(Temporal.PlainDate.from('2021-02-27').add(p1w).toJSON(), '2021-03-06');
assert.sameValue(Temporal.PlainDate.from('2020-02-27').add(p1w).toJSON(), '2020-03-05');
assert.sameValue(Temporal.PlainDate.from('2021-12-24').add(p1w).toJSON(), '2021-12-31');
assert.sameValue(Temporal.PlainDate.from('2021-12-27').add(p1w).toJSON(), '2022-01-03');
assert.sameValue(Temporal.PlainDate.from('2021-01-27').add(p1w).toJSON(), '2021-02-03');
assert.sameValue(Temporal.PlainDate.from('2021-06-27').add(p1w).toJSON(), '2021-07-04');
assert.sameValue(Temporal.PlainDate.from('2021-07-27').add(p1w).toJSON(), '2021-08-03');
assert.sameValue(Temporal.PlainDate.from('2021-02-19').add(p6w).toJSON(), '2021-04-02');
assert.sameValue(Temporal.PlainDate.from('2021-02-27').add(p6w).toJSON(), '2021-04-10');
assert.sameValue(Temporal.PlainDate.from('2020-02-27').add(p6w).toJSON(), '2020-04-09');
assert.sameValue(Temporal.PlainDate.from('2021-12-24').add(p6w).toJSON(), '2022-02-04');
assert.sameValue(Temporal.PlainDate.from('2021-12-27').add(p6w).toJSON(), '2022-02-07');
assert.sameValue(Temporal.PlainDate.from('2021-01-27').add(p6w).toJSON(), '2021-03-10');
assert.sameValue(Temporal.PlainDate.from('2021-06-27').add(p6w).toJSON(), '2021-08-08');
assert.sameValue(Temporal.PlainDate.from('2021-07-27').add(p6w).toJSON(), '2021-09-07');
assert.sameValue(Temporal.PlainDate.from('2020-02-29').add(p2w3d).toJSON(), '2020-03-17');
assert.sameValue(Temporal.PlainDate.from('2020-02-28').add(p2w3d).toJSON(), '2020-03-16');
assert.sameValue(Temporal.PlainDate.from('2021-02-28').add(p2w3d).toJSON(), '2021-03-17');
assert.sameValue(Temporal.PlainDate.from('2020-12-28').add(p2w3d).toJSON(), '2021-01-14');
assert.sameValue(Temporal.PlainDate.from('2020-02-29').add(p1y2w).toJSON(), '2021-03-14');
assert.sameValue(Temporal.PlainDate.from('2020-02-28').add(p1y2w).toJSON(), '2021-03-14');
assert.sameValue(Temporal.PlainDate.from('2021-02-28').add(p1y2w).toJSON(), '2022-03-14');
assert.sameValue(Temporal.PlainDate.from('2020-12-28').add(p1y2w).toJSON(), '2022-01-11');
assert.sameValue(Temporal.PlainDate.from('2020-02-29').add(p2m3w).toJSON(), '2020-05-20');
assert.sameValue(Temporal.PlainDate.from('2020-02-28').add(p2m3w).toJSON(), '2020-05-19');
assert.sameValue(Temporal.PlainDate.from('2021-02-28').add(p2m3w).toJSON(), '2021-05-19');
assert.sameValue(Temporal.PlainDate.from('2020-12-28').add(p2m3w).toJSON(), '2021-03-21');
assert.sameValue(Temporal.PlainDate.from('2019-12-28').add(p2m3w).toJSON(), '2020-03-20');
assert.sameValue(Temporal.PlainDate.from('2019-10-28').add(p2m3w).toJSON(), '2020-01-18');
assert.sameValue(Temporal.PlainDate.from('2019-10-31').add(p2m3w).toJSON(), '2020-01-21');
