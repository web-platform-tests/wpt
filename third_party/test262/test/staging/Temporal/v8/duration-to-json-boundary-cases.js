// Copyright 2022 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from duration-to-json-boundary-cases test
  in V8's mjsunit test duration-to-json-boundary-cases.js
features: [Temporal]
---*/

let MAX_UINT32 = Math.pow(2, 32);
assert.throws(RangeError, () => new Temporal.Duration(MAX_UINT32));
assert.throws(RangeError, () => new Temporal.Duration(-MAX_UINT32));
assert.throws(RangeError, () => new Temporal.Duration(0, MAX_UINT32));
assert.throws(RangeError, () => new Temporal.Duration(0, -MAX_UINT32));
assert.throws(RangeError, () => new Temporal.Duration(0, 0, MAX_UINT32));
assert.throws(RangeError, () => new Temporal.Duration(0, 0, -MAX_UINT32));
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, Number.MAX_SAFE_INTEGER / 86400 + 1));
assert.sameValue(new Temporal.Duration(0, 0, 0, Math.floor(Number.MAX_SAFE_INTEGER / 86400)).toJSON(), 'P' + Math.floor(Number.MAX_SAFE_INTEGER / 86400) + 'D');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, -(Number.MAX_SAFE_INTEGER / 86400 + 1)));
assert.sameValue(new Temporal.Duration(0, 0, 0, -Math.floor(Number.MAX_SAFE_INTEGER / 86400)).toJSON(), '-P' + Math.floor(Number.MAX_SAFE_INTEGER / 86400) + 'D');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, Number.MAX_SAFE_INTEGER / 3600 + 1));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, Math.floor(Number.MAX_SAFE_INTEGER / 3600)).toJSON(), 'PT' + Math.floor(Number.MAX_SAFE_INTEGER / 3600) + 'H');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, -(Number.MAX_SAFE_INTEGER / 3600 + 1)));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, -Math.floor(Number.MAX_SAFE_INTEGER / 3600)).toJSON(), '-PT' + Math.floor(Number.MAX_SAFE_INTEGER / 3600) + 'H');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER / 60 + 1));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, Math.floor(Number.MAX_SAFE_INTEGER / 60)).toJSON(), 'PT' + Math.floor(Number.MAX_SAFE_INTEGER / 60) + 'M');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, -(Number.MAX_SAFE_INTEGER / 60 + 1)));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, -Math.floor(Number.MAX_SAFE_INTEGER / 60)).toJSON(), '-PT' + Math.floor(Number.MAX_SAFE_INTEGER / 60) + 'M');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER + 1));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER).toJSON(), 'PT' + Number.MAX_SAFE_INTEGER + 'S');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, -(Number.MAX_SAFE_INTEGER + 1)));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, -Number.MAX_SAFE_INTEGER).toJSON(), '-PT' + Number.MAX_SAFE_INTEGER + 'S');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER, 1000));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER, 999).toJSON(), 'PT' + Number.MAX_SAFE_INTEGER + '.999S');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, -Number.MAX_SAFE_INTEGER, -1000));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, -Number.MAX_SAFE_INTEGER, -999).toJSON(), '-PT' + Number.MAX_SAFE_INTEGER + '.999S');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER, 999, 1000));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER, 999, 999).toJSON(), 'PT' + Number.MAX_SAFE_INTEGER + '.999999S');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, -Number.MAX_SAFE_INTEGER, -999, -1000));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, -Number.MAX_SAFE_INTEGER, -999, -999).toJSON(), '-PT' + Number.MAX_SAFE_INTEGER + '.999999S');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER, 999, 999, 1000));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER, 999, 999, 999).toJSON(), 'PT' + Number.MAX_SAFE_INTEGER + '.999999999S');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, -Number.MAX_SAFE_INTEGER, -999, -999, -1000));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, -Number.MAX_SAFE_INTEGER, -999, -999, -999).toJSON(), '-PT' + Number.MAX_SAFE_INTEGER + '.999999999S');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER - Math.floor(Number.MAX_SAFE_INTEGER / 1000) + 1, Number.MAX_SAFE_INTEGER, 0, 0));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER - Math.floor(Number.MAX_SAFE_INTEGER / 1000), Number.MAX_SAFE_INTEGER, 0, 0).toJSON(), 'PT' + Number.MAX_SAFE_INTEGER + '.' + Number.MAX_SAFE_INTEGER % 1000 + 'S');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, -(Number.MAX_SAFE_INTEGER - Math.floor(Number.MAX_SAFE_INTEGER / 1000) + 1), -Number.MAX_SAFE_INTEGER, 0, 0));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, -(Number.MAX_SAFE_INTEGER - Math.floor(Number.MAX_SAFE_INTEGER / 1000)), -Number.MAX_SAFE_INTEGER, 0, 0).toJSON(), '-PT' + Number.MAX_SAFE_INTEGER + '.' + Number.MAX_SAFE_INTEGER % 1000 + 'S');
assert.throws(RangeError, () => new Temporal.Duration(0, 0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER - Math.floor(Number.MAX_SAFE_INTEGER / 1000000) + 1, 0, Number.MAX_SAFE_INTEGER, 0));
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, Number.MAX_SAFE_INTEGER - Math.floor(Number.MAX_SAFE_INTEGER / 1000000), 0, Number.MAX_SAFE_INTEGER, 0).toJSON(), 'PT' + Number.MAX_SAFE_INTEGER + '.' + Number.MAX_SAFE_INTEGER % 1000000 + 'S');
assert.sameValue(new Temporal.Duration(MAX_UINT32 - 1).toJSON(), 'P' + (MAX_UINT32 - 1) + 'Y');
assert.sameValue(new Temporal.Duration(-(MAX_UINT32 - 1)).toJSON(), '-P' + (MAX_UINT32 - 1) + 'Y');
assert.sameValue(new Temporal.Duration(0, MAX_UINT32 - 1).toJSON(), 'P' + (MAX_UINT32 - 1) + 'M');
assert.sameValue(new Temporal.Duration(0, -(MAX_UINT32 - 1)).toJSON(), '-P' + (MAX_UINT32 - 1) + 'M');
assert.sameValue(new Temporal.Duration(0, 0, MAX_UINT32 - 1).toJSON(), 'P' + (MAX_UINT32 - 1) + 'W');
assert.sameValue(new Temporal.Duration(0, 0, -(MAX_UINT32 - 1)).toJSON(), '-P' + (MAX_UINT32 - 1) + 'W');
assert.sameValue(new Temporal.Duration(0, 0, 0, MAX_UINT32 - 1).toJSON(), 'P' + (MAX_UINT32 - 1) + 'D');
assert.sameValue(new Temporal.Duration(0, 0, 0, -(MAX_UINT32 - 1)).toJSON(), '-P' + (MAX_UINT32 - 1) + 'D');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, MAX_UINT32 - 1).toJSON(), 'PT' + (MAX_UINT32 - 1) + 'H');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, -(MAX_UINT32 - 1)).toJSON(), '-PT' + (MAX_UINT32 - 1) + 'H');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, MAX_UINT32 - 1).toJSON(), 'PT' + (MAX_UINT32 - 1) + 'M');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, -(MAX_UINT32 - 1)).toJSON(), '-PT' + (MAX_UINT32 - 1) + 'M');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, MAX_UINT32 - 1).toJSON(), 'PT' + (MAX_UINT32 - 1) + 'S');
assert.sameValue(new Temporal.Duration(0, 0, 0, 0, 0, 0, -(MAX_UINT32 - 1)).toJSON(), '-PT' + (MAX_UINT32 - 1) + 'S');
