// META: title=Validate WebNN test helpers
// META: script=resources/utils.js

// This doesn't validate the WebNN API itself, it just verifies behavior of
// non-trivial helper functions.

'use strict';

// Largest integer uniquely representable as a float32.
const MAX_FLOAT32_INTEGER = 2 ** 24;

test(() => {
  [
    [1.00048828125, 0x3c00],
    [1.00146484375, 0x3c02],
    [-1.00048828125, 0xbc00],
    [-1.00146484375, 0xbc02],
    [0, 0x0000],
    [-0, 0x8000],
  ].forEach(([value, bits]) => {
    assert_equals(toHalf(value), bits, `binary16 encoding of ${value}`);
  });
}, 'float16 conversion rounds normal midpoints to even and preserves zero sign');

test(() => {
  [
    [1.5 * 2 ** -24, 0x0002],
    [2.5 * 2 ** -24, 0x0002],
    [-1.5 * 2 ** -24, 0x8002],
    [-2.5 * 2 ** -24, 0x8002],
    [1023.5 * 2 ** -24, 0x0400],
    [-1023.5 * 2 ** -24, 0x8400],
  ].forEach(([value, bits]) => {
    assert_equals(toHalf(value), bits, `binary16 encoding of ${value}`);
  });
}, 'float16 conversion rounds subnormal and normal-boundary midpoints to even');

test(() => {
  [
    [2 ** -25, 0x0000],
    [2 ** -25 * (1 + 2 ** -20), 0x0001],
    [2 ** -25 * (1 - 2 ** -20), 0x0000],
    [-(2 ** -25), 0x8000],
    [-(2 ** -25) * (1 + 2 ** -20), 0x8001],
    [-(2 ** -25) * (1 - 2 ** -20), 0x8000],
  ].forEach(([value, bits]) => {
    assert_equals(toHalf(value), bits, `binary16 encoding of ${value}`);
  });
}, 'float16 conversion distinguishes values around the underflow midpoint');

test(() => {
  [
    [65520, 0x7c00],
    [65520 - 2 ** -20, 0x7bff],
    [-65520, 0xfc00],
    [-65520 + 2 ** -20, 0xfbff],
    [Infinity, 0x7c00],
    [-Infinity, 0xfc00],
  ].forEach(([value, bits]) => {
    assert_equals(toHalf(value), bits, `binary16 encoding of ${value}`);
  });
  const nan = toHalf(NaN);
  assert_equals(nan & 0x7c00, 0x7c00, 'NaN exponent');
  assert_not_equals(nan & 0x03ff, 0, 'NaN fraction');
}, 'float16 conversion distinguishes overflow from the largest finite value');

test(() => {
  const midpoint = 1.00048828125;
  const data = [midpoint - 2 ** -40, midpoint + 2 ** -40,
                -midpoint + 2 ** -40, -midpoint - 2 ** -40];
  const bits = [0x3c00, 0x3c01, 0xbc00, 0xbc01];
  data.forEach((value, index) => {
    assert_equals(toHalf(value), bits[index], `binary16 encoding of ${value}`);
  });
  assert_array_equals(getTypedArrayData('float16', data.length, data), bits);
  assert_array_equals(getTypedArrayData('float16', 2, midpoint), [0x3c00, 0x3c00]);
}, 'float16 conversion does not double-round binary64 inputs through float32');

test(t => {
  const dataType = 'float32';
  [[0.0, 0.0, 0n],
   [0.0, 1e-46, 0n],
   [0.0, 1e-36, 61482021n],
   [1.0, 1.0, 0n],
   [1.0, -1.0, 2130706432n],
   [1.0, 2.0, 8388608n],
   [1.000001, 1.000002, 9n],
   [1.0000001, 1.0000002, 1n],
   [-1.000001, 1.000002, 2130706457n],
   [-1.0000001, 1.0000002, 2130706435n],
   [0.0, 1.401298464324817e-45, 1n],
   [99.28312683105469, 39.03501892089844, 11169050n],
   [MAX_FLOAT32_INTEGER - 1, MAX_FLOAT32_INTEGER, 1n],
  ].forEach(([a, b, expected]) => {
    assert_equals(
        ulpDistance(a, b, dataType), expected,
        `ULP distance between ${a} and ${b}`);
    assert_equals(
        ulpDistance(b, a, dataType), expected,
        `ULP distance between ${b} and ${a} (commutative)`);
    assert_equals(
        ulpDistance(-a, -b, dataType), expected,
        `ULP distance between ${- a} and ${- b} (negated)`);
  });
}, 'ULP Distance - float32');

// TODO: Add test cases for 'float16' data type.

test(() => {
  for (const bits of [0x7c01, 0x7e00, 0x7fff, 0xfc01, 0xfe00, 0xffff]) {
    assert_array_approx_equals_ulp(
        [bits], [NaN], 0, 'float16', 'NaN payload ' + bits);
  }
  const values = new Float32Array(
      new Uint32Array([0x7fc00001, 0x7fffffff, 0xffc00001]).buffer);
  for (const value of values) {
    assert_array_approx_equals_ulp(
        [value], [NaN], 0, 'float32', 'float32 NaN payload');
  }
}, 'ULP comparison accepts NaN independently of sign and payload');

test(() => {
  for (const [actual, expected, dataType] of [
    [0x7c01, Infinity, 'float16'],
    [0x7c00, NaN, 'float16'],
    [0xfc00, NaN, 'float16'],
    [0, NaN, 'float16'],
    [NaN, Infinity, 'float32'],
    [Infinity, NaN, 'float32'],
    [0, NaN, 'float32']
  ]) {
    let error;
    try {
      assert_array_approx_equals_ulp(
          [actual], [expected], 1, dataType, 'mismatched NaN classification');
    } catch (caught) {
      error = caught;
    }
    assert_true(error instanceof AssertionError,
        'Mismatched NaN classification must fail the comparison');
  }
}, 'ULP comparison rejects NaN versus a non-NaN even within tolerance');

// Largest finite values and the midpoints above them, where rounding to
// nearest overflows. Each is an exact binary64 value.
const MAX_FLOAT16 = 65504;
const FLOAT16_OVERFLOW_MIDPOINT = 65520;
const MAX_FLOAT32 = 2 ** 128 - 2 ** 104;
const FLOAT32_OVERFLOW_MIDPOINT = 2 ** 128 - 2 ** 103;

const assertUlpComparisonFails = (actual, expected, nulp, dataType, description) => {
  let error;
  try {
    assert_array_approx_equals_ulp(
        [actual], [expected], nulp, dataType, description);
  } catch (caught) {
    error = caught;
  }
  assert_true(error instanceof AssertionError,
      `${description}: ${dataType} actual ${actual} must not match expected ` +
          `${expected} at ${nulp} ULP`);
};

test(() => {
  assert_equals(Math.fround(MAX_FLOAT32), MAX_FLOAT32);
  assert_equals(toHalf(MAX_FLOAT16), 0x7bff);
  for (const [actual, expected, dataType] of [
    [0x7bff, Infinity, 'float16'],
    [0x7c00, MAX_FLOAT16, 'float16'],
    [0xfbff, -Infinity, 'float16'],
    [0xfc00, -MAX_FLOAT16, 'float16'],
    [MAX_FLOAT32, Infinity, 'float32'],
    [Infinity, MAX_FLOAT32, 'float32'],
    [-MAX_FLOAT32, -Infinity, 'float32'],
    [-Infinity, -MAX_FLOAT32, 'float32'],
  ]) {
    // The encodings are adjacent, so only the classification separates them.
    assert_equals(
        Number(ulpDistance(actual, expected, dataType)), 1,
        `${dataType} encodings of ${actual} and ${expected} are adjacent`);
    for (const nulp of [1, 2, 1024]) {
      assertUlpComparisonFails(
          actual, expected, nulp, dataType, 'finite versus infinite');
    }
  }
}, 'ULP comparison rejects the largest finite value versus infinity within ' +
    'tolerance');

test(() => {
  for (const [actual, expected, dataType] of [
    [0x7c00, Infinity, 'float16'],
    [0xfc00, -Infinity, 'float16'],
    [Infinity, Infinity, 'float32'],
    [-Infinity, -Infinity, 'float32'],
  ]) {
    assert_array_approx_equals_ulp(
        [actual], [expected], 0, dataType, 'same-sign infinities');
  }
  for (const [actual, expected, dataType] of [
    [0x7c00, -Infinity, 'float16'],
    [0xfc00, Infinity, 'float16'],
    [Infinity, -Infinity, 'float32'],
    [-Infinity, Infinity, 'float32'],
  ]) {
    assertUlpComparisonFails(
        actual, expected, 1, dataType, 'opposite-sign infinities');
  }
}, 'ULP comparison accepts same-sign infinities and rejects opposite signs');

test(() => {
  for (const [actual, expected, nulp, dataType] of [
    [0x7bff, MAX_FLOAT16, 0, 'float16'],
    [0x7bfe, MAX_FLOAT16, 1, 'float16'],
    [0x7bff, 65472, 1, 'float16'],
    [0xfbff, -MAX_FLOAT16, 0, 'float16'],
    [0xfbfe, -MAX_FLOAT16, 1, 'float16'],
    [MAX_FLOAT32, MAX_FLOAT32, 0, 'float32'],
    [MAX_FLOAT32 - 2 ** 104, MAX_FLOAT32, 1, 'float32'],
    [MAX_FLOAT32, MAX_FLOAT32 - 2 ** 104, 1, 'float32'],
    [-MAX_FLOAT32, -MAX_FLOAT32, 0, 'float32'],
    [-(MAX_FLOAT32 - 2 ** 104), -MAX_FLOAT32, 1, 'float32'],
  ]) {
    assert_array_approx_equals_ulp(
        [actual], [expected], nulp, dataType, 'adjacent finite values');
  }
  for (const [actual, expected, dataType] of [
    [0x7bfe, MAX_FLOAT16, 'float16'],
    [0xfbfe, -MAX_FLOAT16, 'float16'],
    [MAX_FLOAT32 - 2 ** 104, MAX_FLOAT32, 'float32'],
    [-(MAX_FLOAT32 - 2 ** 104), -MAX_FLOAT32, 'float32'],
  ]) {
    assertUlpComparisonFails(
        actual, expected, 0, dataType, 'adjacent finite values');
  }
}, 'ULP comparison keeps its tolerance for finite values next to the ' +
    'largest finite value');

test(() => {
  // A reference that rounds to infinity in the output data type expects an
  // infinity, and one that rounds to the largest finite value does not.
  for (const [actual, expected, dataType] of [
    [0x7c00, FLOAT16_OVERFLOW_MIDPOINT, 'float16'],
    [0x7c00, 1e5, 'float16'],
    [0xfc00, -FLOAT16_OVERFLOW_MIDPOINT, 'float16'],
    [Infinity, FLOAT32_OVERFLOW_MIDPOINT, 'float32'],
    [Infinity, 1e39, 'float32'],
    [-Infinity, -FLOAT32_OVERFLOW_MIDPOINT, 'float32'],
  ]) {
    assert_array_approx_equals_ulp(
        [actual], [expected], 0, dataType, 'reference overflows the type');
    assertUlpComparisonFails(
        dataType === 'float16' ? toHalf(Math.sign(expected) * MAX_FLOAT16) :
                                 Math.sign(expected) * MAX_FLOAT32,
        expected, 1, dataType, 'reference overflows the type');
  }
  for (const [actual, expected, dataType] of [
    [0x7c00, FLOAT16_OVERFLOW_MIDPOINT - 2 ** -20, 'float16'],
    [0xfc00, -FLOAT16_OVERFLOW_MIDPOINT + 2 ** -20, 'float16'],
    [Infinity, FLOAT32_OVERFLOW_MIDPOINT - 2 ** 75, 'float32'],
    [-Infinity, -FLOAT32_OVERFLOW_MIDPOINT + 2 ** 75, 'float32'],
  ]) {
    assertUlpComparisonFails(
        actual, expected, 1, dataType, 'reference rounds to a finite value');
    assert_array_approx_equals_ulp(
        [dataType === 'float16' ? toHalf(Math.sign(expected) * MAX_FLOAT16) :
                                  Math.sign(expected) * MAX_FLOAT32],
        [expected], 0, dataType, 'reference rounds to a finite value');
  }
}, 'ULP comparison classifies the reference after rounding it to the ' +
    'output data type');

test(t => {
  const dataType = 'int64';
  [[0n, 0n, 0n],
   [1n, 0n, 1n],
   [1n, 2n, 1n],
   [10n, 11n, 1n],
   [10n, 20n, 10n],
   [100000001n, 100000002n, 1n],
   [0x7FFFFFFFFFFFFFFEn, 0x7FFFFFFFFFFFFFFFn, 1n],
   [-0x7FFFFFFFFFFFFFFFn, 0x7FFFFFFFFFFFFFFFn, 0xFFFFFFFFFFFFFFFEn],
  ].forEach(([a, b, expected]) => {
    assert_equals(
        ulpDistance(a, b, dataType), expected,
        `ULP distance between ${a} and ${b}`);
    assert_equals(
        ulpDistance(b, a, dataType), expected,
        `ULP distance between ${b} and ${a} (commutative)`);
    assert_equals(
        ulpDistance(-a, -b, dataType), expected,
        `ULP distance between ${- a} and ${- b} (negated)`);
  });
  assert_equals(
      ulpDistance(-0x8000000000000000n, 0x7FFFFFFFFFFFFFFFn, dataType),
      0xFFFFFFFFFFFFFFFFn, 'ULP distance between min and max int64');
}, 'ULP Distance - int64');

test(t => {
  const dataType = 'uint64';
  [[0n, 0n, 0n],
   [1n, 0n, 1n],
   [1n, 2n, 1n],
   [10n, 11n, 1n],
   [10n, 20n, 10n],
   [100000001n, 100000002, 1n],
   [0xFFFFFFFFFFFFFFFEn, 0xFFFFFFFFFFFFFFFFn, 1n],
   [0n, 0xFFFFFFFFFFFFFFFFn, 0xFFFFFFFFFFFFFFFFn],
  ].forEach(([a, b, expected]) => {
    assert_equals(
        ulpDistance(a, b, dataType), expected,
        `ULP distance between ${a} and ${b}`);
    assert_equals(
        ulpDistance(b, a, dataType), expected,
        `ULP distance between ${b} and ${a} (commutative)`);
  });
}, 'ULP Distance - uint64');

test(t => {
  const dataType = 'int32';
  [[0, 0, 0],
   [1, 0, 1],
   [1, 2, 1],
   [10, 11, 1],
   [10, 20, 10],
   [100000001, 100000002, 1],
   [0x7FFFFFFE, 0x7FFFFFFF, 1],
   [-0x7FFFFFFF, 0x7FFFFFFF, 0xFFFFFFFE],
  ].forEach(([a, b, expected]) => {
    assert_equals(
        ulpDistance(a, b, dataType), expected,
        `ULP distance between ${a} and ${b}`);
    assert_equals(
        ulpDistance(b, a, dataType), expected,
        `ULP distance between ${b} and ${a} (commutative)`);
    assert_equals(
        ulpDistance(-a, -b, dataType), expected,
        `ULP distance between ${- a} and ${- b} (negated)`);
  });
  assert_equals(
      ulpDistance(-0x80000000, 0x7FFFFFFF, dataType), 0xFFFFFFFF,
      'ULP distance between min and max int32');
}, 'ULP Distance - int32');

test(t => {
  const dataType = 'uint32';
  [[0, 0, 0],
   [1, 0, 1],
   [1, 2, 1],
   [10, 11, 1],
   [10, 20, 10],
   [100000001, 100000002, 1],
   [0xFFFFFFFE, 0xFFFFFFFF, 1],
   [0, 0xFFFFFFFF, 0xFFFFFFFF],
  ].forEach(([a, b, expected]) => {
    assert_equals(
        ulpDistance(a, b, dataType), expected,
        `ULP distance between ${a} and ${b}`);
    assert_equals(
        ulpDistance(b, a, dataType), expected,
        `ULP distance between ${b} and ${a} (commutative)`);
  });
}, 'ULP Distance - uint32');

test(t => {
  const dataType = 'int8';
  [[0, 0, 0],
   [1, 0, 1],
   [1, 2, 1],
   [10, 11, 1],
   [10, 20, 10],
   [101, 102, 1],
   [0x7E, 0x7F, 1],
   [-0x7F, 0x7F, 0xFE],
  ].forEach(([a, b, expected]) => {
    assert_equals(
        ulpDistance(a, b, dataType), expected,
        `ULP distance between ${a} and ${b}`);
    assert_equals(
        ulpDistance(b, a, dataType), expected,
        `ULP distance between ${b} and ${a} (commutative)`);
    assert_equals(
        ulpDistance(-a, -b, dataType), expected,
        `ULP distance between ${- a} and ${- b} (negated)`);
  });
  assert_equals(
      ulpDistance(-0x80, 0x7F, dataType), 0xFF,
      'ULP distance between min and max int8');
}, 'ULP Distance - int8');

test(t => {
  const dataType = 'uint8';
  [[0, 0, 0],
   [1, 0, 1],
   [1, 2, 1],
   [10, 11, 1],
   [10, 20, 10],
   [101, 102, 1],
   [0xFE, 0xFF, 1],
   [0, 0xFF, 0xFF],
  ].forEach(([a, b, expected]) => {
    assert_equals(
        ulpDistance(a, b, dataType), expected,
        `ULP distance between ${a} and ${b}`);
    assert_equals(
        ulpDistance(b, a, dataType), expected,
        `ULP distance between ${b} and ${a} (commutative)`);
  });
}, 'ULP Distance - uint8');

test(t => {
  const dataType = 'int4';
  [[0, 0, 0],
   [1, 0, 1],
   [1, 2, 1],
   [10, 11, 1],
   [1, 10, 9],
   [6, 7, 1],
   [-7, 7, 14],
  ].forEach(([a, b, expected]) => {
    assert_equals(
        ulpDistance(a, b, dataType), expected,
        `ULP distance between ${a} and ${b}`);
    assert_equals(
        ulpDistance(b, a, dataType), expected,
        `ULP distance between ${b} and ${a} (commutative)`);
    assert_equals(
        ulpDistance(-a, -b, dataType), expected,
        `ULP distance between ${- a} and ${- b} (negated)`);
  });
  assert_equals(
      ulpDistance(-0x8, 0x7, dataType), 0xF,
      'ULP distance between min and max int4');
}, 'ULP Distance - int4');

test(t => {
  const dataType = 'uint4';
  [[0, 0, 0],
   [1, 0, 1],
   [1, 2, 1],
   [10, 11, 1],
   [1, 10, 9],
   [0xE, 0xF, 1],
   [0, 0xF, 0xF],
  ].forEach(([a, b, expected]) => {
    assert_equals(
        ulpDistance(a, b, dataType), expected,
        `ULP distance between ${a} and ${b}`);
    assert_equals(
        ulpDistance(b, a, dataType), expected,
        `ULP distance between ${b} and ${a} (commutative)`);
  });
}, 'ULP Distance - uint4');

test(() => {
  for (const [a, b, expected] of [
    [0, -0, 0], [2 ** -24, 0, 1], [-(2 ** -24), 0, 1],
    [-(2 ** -24), 2 ** -24, 2], [-(2 ** -23), -(2 ** -24), 1],
    [1, -1, 30720], [-1, -1.0009765625, 1],
    [2 ** -14, 1023 * 2 ** -24, 1], [65504, Infinity, 1]
  ]) {
    assert_equals(ulpDistance(toHalf(a), b, 'float16'), expected,
        'forward distance between ' + a + ' and ' + b);
    assert_equals(ulpDistance(toHalf(b), a, 'float16'), expected,
        'reverse distance between ' + a + ' and ' + b);
    assert_equals(ulpDistance(toHalf(-a), -b, 'float16'), expected,
        'negated distance between ' + a + ' and ' + b);
  }
}, 'ULP Distance - float16, including opposite signs and zero');

test(() => {
  assert_array_approx_equals_ulp([0x8001], [0], 1, 'float16',
      'negative minimum subnormal is one ULP from zero');
  assert_array_approx_equals_ulp([0x8001], [2 ** -24], 2, 'float16',
      'opposite minimum subnormals are two ULPs apart');
}, 'Float16 array comparison uses ordered numerical ULP distance');

test(() => {
  for (const [bits, expected] of [[1, 1], [2, 2], [3, 3]]) {
    let error;
    try {
      assert_array_approx_equals_ulp([bits], [expected], 0, 'float16',
          'storage encoding must not equal the expected numerical value');
    } catch (caught) {
      error = caught;
    }
    assert_true(error instanceof AssertionError,
        'A subnormal storage encoding must not match the integer value');
  }
}, 'Float16 array comparison does not confuse raw bits with values');
