// META: global=window,dedicatedworker,sharedworker
// META: script=/common/utils.js

promise_test(async () => {
  const mod = await import('./bom-utf-8.json', { with: { type: 'bytes' } });
  assert_true(mod instanceof Uint8Array);
  assert_array_equals(Array.from(mod), [
    239, 187, 191, 123, 32, 34, 100, 97, 116, 97, 34,
    58, 32, 34, 104, 101, 108, 108, 111, 34, 32, 125,
  ]);
}, 'UTF-8 BOM should be ignored when importing bytes');

promise_test(async () => {
  const mod = await import('./bom-utf-16be.json', { with: { type: 'bytes' } });
  assert_true(mod instanceof Uint8Array);
  assert_array_equals(Array.from(mod), [
    254, 255, 0, 123, 0, 32, 0, 34, 0, 100, 0, 97, 0, 116,
    0, 97, 0, 34, 0, 58, 0, 32, 0, 34, 0, 104, 0, 101,
    0, 108, 0, 108, 0, 111, 0, 34, 0, 32, 0, 125,
  ]);
}, 'UTF-16BE BOM should be ignored when importing bytes');

promise_test(async () => {
  const mod = await import('./bom-utf-16le.json', { with: { type: 'bytes' } });
  assert_true(mod instanceof Uint8Array);
  assert_array_equals(Array.from(mod), [
    255, 254, 123, 0, 32, 0, 34, 0, 100, 0, 97, 0, 116, 0,
    97, 0, 34, 0, 58, 0, 32, 0, 34, 0, 104, 0, 101, 0,
    108, 0, 108, 0, 111, 0, 34, 0, 32, 0, 125, 0,
  ]);
}, 'UTF-16LE BOM should be ignored when importing bytes');

