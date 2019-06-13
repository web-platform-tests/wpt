// META: global=jsshell
// META: script=/wasm/jsapi/wasm-module-builder.js
// META: script=/wasm/jsapi/assertions.js

promise_test(async () => {
  const type_if_fi = makeSig([kWasmF32, kWasmI32], [kWasmI32, kWasmF32]);

  const builder = new WasmModuleBuilder();

  builder
    .addFunction("swap", type_if_fi)
    .addBody([
        kExprGetLocal, 1,
        kExprGetLocal, 0,
        kExprReturn,
    ])
    .exportFunc();

  const buffer = builder.toBuffer();

  const result = await WebAssembly.instantiate(buffer);
  const swapped = result.instance.exports.swap(7, 4.2);
  assert_true(Array.isArray(swapped));
  assert_equals(Object.getPrototypeOf(swapped), Array.prototype);
  assert_array_equals(swapped, [4.2, 7]);
}, "multiple return values from wasm to js");

promise_test(async () => {
  const type_if_fi = makeSig([kWasmF32, kWasmI32], [kWasmI32, kWasmF32]);

  const builder = new WasmModuleBuilder();

  const swap = builder
    .addFunction("swap", type_if_fi)
    .addBody([
        kExprGetLocal, 1,
        kExprGetLocal, 0,
        kExprReturn,
    ]);
  builder
    .addFunction("callswap", kSig_i_v)
    .addBody([
        ...wasmF32Const(4.2),
        ...wasmI32Const(7),
        kExprCallFunction, swap.index,
        kExprDrop,
        kExprReturn,
    ])
    .exportFunc();

  const buffer = builder.toBuffer();

  const result = await WebAssembly.instantiate(buffer);
  const swapped = result.instance.exports.callswap();
  assert_equals(swapped, 7);
}, "multiple return values inside wasm");
