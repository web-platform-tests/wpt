// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-date-until test
  in V8's mjsunit test calendar-date-until.js
features: [Temporal]
---*/

[
  'hour',
  'minute',
  'second',
  'millisecond',
  'microsecond',
  'nanosecond'
].forEach(function (largestUnit) {
  assert.throws(RangeError, () => Temporal.PlainDate.from('2021-07-16').until('2021-07-17', { largestUnit }));
});
assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-16').toJSON(), 'PT0S');
assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-17').toJSON(), 'P1D');
assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-08-17').toJSON(), 'P32D');
assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-09-16').toJSON(), 'P62D');
assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2022-07-16').toJSON(), 'P365D');
assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2031-07-16').toJSON(), 'P3652D');
assert.sameValue(Temporal.PlainDate.from('2021-07-17').until('2021-07-16').toJSON(), '-P1D');
assert.sameValue(Temporal.PlainDate.from('2021-08-17').until('2021-07-16').toJSON(), '-P32D');
assert.sameValue(Temporal.PlainDate.from('2021-09-16').until('2021-07-16').toJSON(), '-P62D');
assert.sameValue(Temporal.PlainDate.from('2022-07-16').until('2021-07-16').toJSON(), '-P365D');
assert.sameValue(Temporal.PlainDate.from('2031-07-16').until('2021-07-16').toJSON(), '-P3652D');
[
  'day',
  'days'
].forEach(function (largestUnit) {
  let opt = { largestUnit };
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-16', opt).toJSON(), 'PT0S');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-17', opt).toJSON(), 'P1D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-08-17', opt).toJSON(), 'P32D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-09-16', opt).toJSON(), 'P62D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2022-07-16', opt).toJSON(), 'P365D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2031-07-16', opt).toJSON(), 'P3652D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-17').until('2021-07-16', opt).toJSON(), '-P1D');
  assert.sameValue(Temporal.PlainDate.from('2021-08-17').until('2021-07-16', opt).toJSON(), '-P32D');
  assert.sameValue(Temporal.PlainDate.from('2021-09-16').until('2021-07-16', opt).toJSON(), '-P62D');
  assert.sameValue(Temporal.PlainDate.from('2022-07-16').until('2021-07-16', opt).toJSON(), '-P365D');
  assert.sameValue(Temporal.PlainDate.from('2031-07-16').until('2021-07-16', opt).toJSON(), '-P3652D');
});
[
  'week',
  'weeks'
].forEach(function (largestUnit) {
  let opt = { largestUnit };
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-16', opt).toJSON(), 'PT0S');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-17', opt).toJSON(), 'P1D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-23', opt).toJSON(), 'P1W');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-08-17', opt).toJSON(), 'P4W4D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-08-13', opt).toJSON(), 'P4W');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-09-16', opt).toJSON(), 'P8W6D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2022-07-16', opt).toJSON(), 'P52W1D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2031-07-16', opt).toJSON(), 'P521W5D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-17').until('2021-07-16', opt).toJSON(), '-P1D');
  assert.sameValue(Temporal.PlainDate.from('2021-08-17').until('2021-07-16', opt).toJSON(), '-P4W4D');
  assert.sameValue(Temporal.PlainDate.from('2021-08-13').until('2021-07-16', opt).toJSON(), '-P4W');
  assert.sameValue(Temporal.PlainDate.from('2021-09-16').until('2021-07-16', opt).toJSON(), '-P8W6D');
  assert.sameValue(Temporal.PlainDate.from('2022-07-16').until('2021-07-16', opt).toJSON(), '-P52W1D');
  assert.sameValue(Temporal.PlainDate.from('2031-07-16').until('2021-07-16', opt).toJSON(), '-P521W5D');
});
[
  'month',
  'months'
].forEach(function (largestUnit) {
  let opt = { largestUnit };
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-16', opt).toJSON(), 'PT0S');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-17', opt).toJSON(), 'P1D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-23', opt).toJSON(), 'P7D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-08-16', opt).toJSON(), 'P1M');
  assert.sameValue(Temporal.PlainDate.from('2020-12-16').until('2021-01-16', opt).toJSON(), 'P1M');
  assert.sameValue(Temporal.PlainDate.from('2021-01-05').until('2021-02-05', opt).toJSON(), 'P1M');
  assert.sameValue(Temporal.PlainDate.from('2021-01-07').until('2021-03-07', opt).toJSON(), 'P2M');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-08-17', opt).toJSON(), 'P1M1D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-08-13', opt).toJSON(), 'P28D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-09-16', opt).toJSON(), 'P2M');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2022-07-16', opt).toJSON(), 'P12M');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2031-07-16', opt).toJSON(), 'P120M');
  assert.sameValue(Temporal.PlainDate.from('2021-07-17').until('2021-07-16', opt).toJSON(), '-P1D');
  assert.sameValue(Temporal.PlainDate.from('2021-08-17').until('2021-07-16', opt).toJSON(), '-P1M1D');
  assert.sameValue(Temporal.PlainDate.from('2021-08-13').until('2021-07-16', opt).toJSON(), '-P28D');
  assert.sameValue(Temporal.PlainDate.from('2021-08-16').until('2021-07-16', opt).toJSON(), '-P1M');
  assert.sameValue(Temporal.PlainDate.from('2021-08-16').until('2021-07-13', opt).toJSON(), '-P1M3D');
  assert.sameValue(Temporal.PlainDate.from('2021-09-16').until('2021-07-16', opt).toJSON(), '-P2M');
  assert.sameValue(Temporal.PlainDate.from('2021-09-21').until('2021-07-16', opt).toJSON(), '-P2M5D');
  assert.sameValue(Temporal.PlainDate.from('2022-07-16').until('2021-07-16', opt).toJSON(), '-P12M');
  assert.sameValue(Temporal.PlainDate.from('2022-07-17').until('2021-07-16', opt).toJSON(), '-P12M1D');
  assert.sameValue(Temporal.PlainDate.from('2031-07-16').until('2021-07-16', opt).toJSON(), '-P120M');
});
[
  'year',
  'years'
].forEach(function (largestUnit) {
  let opt = { largestUnit };
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-16', opt).toJSON(), 'PT0S');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-17', opt).toJSON(), 'P1D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-07-23', opt).toJSON(), 'P7D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-08-16', opt).toJSON(), 'P1M');
  assert.sameValue(Temporal.PlainDate.from('2020-12-16').until('2021-01-16', opt).toJSON(), 'P1M');
  assert.sameValue(Temporal.PlainDate.from('2021-01-05').until('2021-02-05', opt).toJSON(), 'P1M');
  assert.sameValue(Temporal.PlainDate.from('2021-01-07').until('2021-03-07', opt).toJSON(), 'P2M');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-08-17', opt).toJSON(), 'P1M1D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-08-13', opt).toJSON(), 'P28D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2021-09-16', opt).toJSON(), 'P2M');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2022-07-16', opt).toJSON(), 'P1Y');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2022-07-19', opt).toJSON(), 'P1Y3D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2022-09-19', opt).toJSON(), 'P1Y2M3D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2031-07-16', opt).toJSON(), 'P10Y');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('2031-12-16', opt).toJSON(), 'P10Y5M');
  assert.sameValue(Temporal.PlainDate.from('1997-12-16').until('2021-07-16', opt).toJSON(), 'P23Y7M');
  assert.sameValue(Temporal.PlainDate.from('1997-07-16').until('2021-07-16', opt).toJSON(), 'P24Y');
  assert.sameValue(Temporal.PlainDate.from('1997-07-16').until('2021-07-15', opt).toJSON(), 'P23Y11M29D');
  assert.sameValue(Temporal.PlainDate.from('1997-06-16').until('2021-06-15', opt).toJSON(), 'P23Y11M30D');
  assert.sameValue(Temporal.PlainDate.from('1960-02-16').until('2020-03-16', opt).toJSON(), 'P60Y1M');
  assert.sameValue(Temporal.PlainDate.from('1960-02-16').until('2021-03-15', opt).toJSON(), 'P61Y27D');
  assert.sameValue(Temporal.PlainDate.from('1960-02-16').until('2020-03-15', opt).toJSON(), 'P60Y28D');
  assert.sameValue(Temporal.PlainDate.from('2021-03-30').until('2021-07-16', opt).toJSON(), 'P3M16D');
  assert.sameValue(Temporal.PlainDate.from('2020-03-30').until('2021-07-16', opt).toJSON(), 'P1Y3M16D');
  assert.sameValue(Temporal.PlainDate.from('1960-03-30').until('2021-07-16', opt).toJSON(), 'P61Y3M16D');
  assert.sameValue(Temporal.PlainDate.from('2019-12-30').until('2021-07-16', opt).toJSON(), 'P1Y6M16D');
  assert.sameValue(Temporal.PlainDate.from('2020-12-30').until('2021-07-16', opt).toJSON(), 'P6M16D');
  assert.sameValue(Temporal.PlainDate.from('1997-12-30').until('2021-07-16', opt).toJSON(), 'P23Y6M16D');
  assert.sameValue(Temporal.PlainDate.from('0001-12-25').until('2021-07-16', opt).toJSON(), 'P2019Y6M21D');
  assert.sameValue(Temporal.PlainDate.from('2019-12-30').until('2021-03-05', opt).toJSON(), 'P1Y2M5D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-17').until('2021-07-16', opt).toJSON(), '-P1D');
  assert.sameValue(Temporal.PlainDate.from('2021-08-17').until('2021-07-16', opt).toJSON(), '-P1M1D');
  assert.sameValue(Temporal.PlainDate.from('2021-08-13').until('2021-07-16', opt).toJSON(), '-P28D');
  assert.sameValue(Temporal.PlainDate.from('2021-08-16').until('2021-07-16', opt).toJSON(), '-P1M');
  assert.sameValue(Temporal.PlainDate.from('2021-08-16').until('2021-07-13', opt).toJSON(), '-P1M3D');
  assert.sameValue(Temporal.PlainDate.from('2021-09-16').until('2021-07-16', opt).toJSON(), '-P2M');
  assert.sameValue(Temporal.PlainDate.from('2021-09-21').until('2021-07-16', opt).toJSON(), '-P2M5D');
  assert.sameValue(Temporal.PlainDate.from('2022-07-16').until('2021-07-16', opt).toJSON(), '-P1Y');
  assert.sameValue(Temporal.PlainDate.from('2022-07-17').until('2021-07-16', opt).toJSON(), '-P1Y1D');
  assert.sameValue(Temporal.PlainDate.from('2022-10-17').until('2021-07-16', opt).toJSON(), '-P1Y3M1D');
  assert.sameValue(Temporal.PlainDate.from('2031-07-16').until('2021-07-16', opt).toJSON(), '-P10Y');
  assert.sameValue(Temporal.PlainDate.from('2032-07-16').until('2021-08-16', opt).toJSON(), '-P10Y11M');
  assert.sameValue(Temporal.PlainDate.from('2031-12-16').until('2021-07-16', opt).toJSON(), '-P10Y5M');
  assert.sameValue(Temporal.PlainDate.from('2011-07-16').until('1997-12-16', opt).toJSON(), '-P13Y7M');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('1997-07-16', opt).toJSON(), '-P24Y');
  assert.sameValue(Temporal.PlainDate.from('2021-07-15').until('1997-07-16', opt).toJSON(), '-P23Y11M30D');
  assert.sameValue(Temporal.PlainDate.from('2021-06-15').until('1997-06-16', opt).toJSON(), '-P23Y11M29D');
  assert.sameValue(Temporal.PlainDate.from('2020-03-16').until('1960-02-16', opt).toJSON(), '-P60Y1M');
  assert.sameValue(Temporal.PlainDate.from('2021-03-15').until('1960-02-16', opt).toJSON(), '-P61Y28D');
  assert.sameValue(Temporal.PlainDate.from('2020-03-15').until('1960-02-16', opt).toJSON(), '-P60Y28D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('1960-03-30', opt).toJSON(), '-P61Y3M17D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('0001-12-25', opt).toJSON(), '-P2019Y6M22D');
  assert.sameValue(Temporal.PlainDate.from('2021-07-16').until('1997-12-30', opt).toJSON(), '-P23Y6M17D');
});
