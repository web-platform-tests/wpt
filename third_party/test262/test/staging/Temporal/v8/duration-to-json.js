// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from duration-to-json test
  in V8's mjsunit test duration-to-json.js
features: [Temporal]
---*/

assert.sameValue(new Temporal.Duration().toJSON(), 'PT0S');
assert.sameValue(new Temporal.Duration(1).toJSON(), 'P1Y');
assert.sameValue(new Temporal.Duration(-1).toJSON(), '-P1Y');
assert.sameValue(new Temporal.Duration(1234567890).toJSON(), 'P1234567890Y');
assert.sameValue(new Temporal.Duration(-1234567890).toJSON(), '-P1234567890Y');
assert.sameValue(new Temporal.Duration(1, 2).toJSON(), 'P1Y2M');
assert.sameValue(new Temporal.Duration(-1, -2).toJSON(), '-P1Y2M');
assert.sameValue(new Temporal.Duration(0, 2).toJSON(), 'P2M');
assert.sameValue(new Temporal.Duration(0, -2).toJSON(), '-P2M');
assert.sameValue(new Temporal.Duration(0, 1234567890).toJSON(), 'P1234567890M');
assert.sameValue(new Temporal.Duration(0, -1234567890).toJSON(), '-P1234567890M');
assert.sameValue(new Temporal.Duration(1, 2, 3).toJSON(), 'P1Y2M3W');
assert.sameValue(new Temporal.Duration(-1, -2, -3).toJSON(), '-P1Y2M3W');
assert.sameValue(new Temporal.Duration(0, 0, 3).toJSON(), 'P3W');
assert.sameValue(new Temporal.Duration(0, 0, -3).toJSON(), '-P3W');
assert.sameValue(new Temporal.Duration(1, 0, 3).toJSON(), 'P1Y3W');
assert.sameValue(new Temporal.Duration(-1, 0, -3).toJSON(), '-P1Y3W');
assert.sameValue(new Temporal.Duration(0, 2, 3).toJSON(), 'P2M3W');
assert.sameValue(new Temporal.Duration(0, -2, -3).toJSON(), '-P2M3W');
assert.sameValue(new Temporal.Duration(0, 0, 1234567890).toJSON(), 'P1234567890W');
assert.sameValue(new Temporal.Duration(0, 0, -1234567890).toJSON(), '-P1234567890W');
assert.sameValue(new Temporal.Duration(1, 2, 3, 4).toJSON(), 'P1Y2M3W4D');
assert.sameValue(new Temporal.Duration(-1, -2, -3, -4).toJSON(), '-P1Y2M3W4D');
assert.sameValue(new Temporal.Duration(0, 0, 0, 1234567890).toJSON(), 'P1234567890D');
assert.sameValue(new Temporal.Duration(0, 0, 0, -1234567890).toJSON(), '-P1234567890D');
assert.sameValue(new Temporal.Duration(0, 0, 0, 4).toJSON(), 'P4D');
assert.sameValue(new Temporal.Duration(0, 0, 0, -4).toJSON(), '-P4D');
assert.sameValue(new Temporal.Duration(1, 0, 0, 4).toJSON(), 'P1Y4D');
assert.sameValue(new Temporal.Duration(-1, 0, 0, -4).toJSON(), '-P1Y4D');
assert.sameValue(new Temporal.Duration(0, 2, 0, 4).toJSON(), 'P2M4D');
assert.sameValue(new Temporal.Duration(0, -2, 0, -4).toJSON(), '-P2M4D');
assert.sameValue(new Temporal.Duration(0, 0, 3, 4).toJSON(), 'P3W4D');
assert.sameValue(new Temporal.Duration(0, 0, -3, -4).toJSON(), '-P3W4D');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 5).toJSON(), 'PT5H');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, -5).toJSON(), '-PT5H');
assert.sameValue(new Temporal.Duration(1, 0, 0, 0, 5).toJSON(), 'P1YT5H');
assert.sameValue(new Temporal.Duration(-1, 0, 0, 0, -5).toJSON(), '-P1YT5H');
assert.sameValue(new Temporal.Duration(0, 2, 0, 0, 5).toJSON(), 'P2MT5H');
assert.sameValue(new Temporal.Duration(0, -2, 0, 0, -5).toJSON(), '-P2MT5H');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 6).toJSON(), 'PT6M');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, -6).toJSON(), '-PT6M');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 5, 6).toJSON(), 'PT5H6M');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, -5, -6).toJSON(), '-PT5H6M');
assert.sameValue(new Temporal.Duration(0, 0, 3, 0, 0, 6).toJSON(), 'P3WT6M');
assert.sameValue(new Temporal.Duration(0, 0, -3, 0, 0, -6).toJSON(), '-P3WT6M');
assert.sameValue(new Temporal.Duration(0, 0, 0, 4, 0, 6).toJSON(), 'P4DT6M');
assert.sameValue(new Temporal.Duration(0, 0, 0, -4, 0, -6).toJSON(), '-P4DT6M');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 7).toJSON(), 'PT7S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, -7).toJSON(), '-PT7S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 5, 0, 7).toJSON(), 'PT5H7S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, -5, 0, -7).toJSON(), '-PT5H7S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 6, 7).toJSON(), 'PT6M7S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, -6, -7).toJSON(), '-PT6M7S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 5, 6, 7).toJSON(), 'PT5H6M7S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, -5, -6, -7).toJSON(), '-PT5H6M7S');
assert.sameValue(new Temporal.Duration(1, 0, 0, 0, 5, 6, 7).toJSON(), 'P1YT5H6M7S');
assert.sameValue(new Temporal.Duration(-1, 0, 0, 0, -5, -6, -7).toJSON(), '-P1YT5H6M7S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 8).toJSON(), 'PT0.008S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, -8).toJSON(), '-PT0.008S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 80).toJSON(), 'PT0.08S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, -80).toJSON(), '-PT0.08S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 87).toJSON(), 'PT0.087S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, -87).toJSON(), '-PT0.087S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 876).toJSON(), 'PT0.876S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, -876).toJSON(), '-PT0.876S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 876543).toJSON(), 'PT876.543S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, -876543).toJSON(), '-PT876.543S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 9).toJSON(), 'PT0.000009S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, -9).toJSON(), '-PT0.000009S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 90).toJSON(), 'PT0.00009S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, -90).toJSON(), '-PT0.00009S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 98).toJSON(), 'PT0.000098S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, -98).toJSON(), '-PT0.000098S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 900).toJSON(), 'PT0.0009S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, -900).toJSON(), '-PT0.0009S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 987).toJSON(), 'PT0.000987S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, -987).toJSON(), '-PT0.000987S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 987654).toJSON(), 'PT0.987654S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, -987654).toJSON(), '-PT0.987654S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 987654321).toJSON(), 'PT987.654321S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, -987654321).toJSON(), '-PT987.654321S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, 1).toJSON(), 'PT0.000000001S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, -1).toJSON(), '-PT0.000000001S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, 10).toJSON(), 'PT0.00000001S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, -10).toJSON(), '-PT0.00000001S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, 12).toJSON(), 'PT0.000000012S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, -12).toJSON(), '-PT0.000000012S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, 100).toJSON(), 'PT0.0000001S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, -100).toJSON(), '-PT0.0000001S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, 123).toJSON(), 'PT0.000000123S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, -123).toJSON(), '-PT0.000000123S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, 123456).toJSON(), 'PT0.000123456S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, -123456).toJSON(), '-PT0.000123456S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, 123456789).toJSON(), 'PT0.123456789S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, -123456789).toJSON(), '-PT0.123456789S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, 1234567891).toJSON(), 'PT1.234567891S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, -1234567891).toJSON(), '-PT1.234567891S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 4, 3, 2, 1).toJSON(), 'PT4.003002001S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, -4, -3, -2, -1).toJSON(), '-PT4.003002001S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 4, 3, 2, 90001).toJSON(), 'PT4.003092001S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, -4, -3, -2, -90001).toJSON(), '-PT4.003092001S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, 4, 3, 2, 90080001).toJSON(), 'PT4.093082001S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, -4, -3, -2, -90080001).toJSON(), '-PT4.093082001S');
assert.sameValue(new Temporal.Duration(1, 2, 3, 4, 5, 6, 7, 8, 9, 1).toJSON(), 'P1Y2M3W4DT5H6M7.008009001S');
assert.sameValue(new Temporal.Duration(-1, -2, -3, -4, -5, -6, -7, -8, -9, -1).toJSON(), '-P1Y2M3W4DT5H6M7.008009001S');
assert.sameValue(new Temporal.Duration(1234, 2345, 3456, 4567, 5678, 6789, 7890, 890, 901, 123).toJSON(), 'P1234Y2345M3456W4567DT5678H6789M7890.890901123S');
assert.sameValue(new Temporal.Duration(-1234, -2345, -3456, -4567, -5678, -6789, -7890, -890, -901, -123).toJSON(), '-P1234Y2345M3456W4567DT5678H6789M7890.890901123S');
