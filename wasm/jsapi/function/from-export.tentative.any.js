// META: global=window,dedicatedworker,jsshell
// META: script=/wasm/jsapi/assertions.js
// META: script=/wasm/jsapi/wasm-module-builder.js

promise_test(async () => {
  assert_implements(WebAssembly.Function, "WebAssembly.Function is not implemented");

  const builder = new WasmModuleBuilder();
  builder.addFunction("f", kSig_i_v)
    .addBody([kExprI32Const, 1])
    .exportFunc();
  const {instance} = await WebAssembly.instantiate(builder.toBuffer());
  const f = instance.exports.f;

  const wrapped = new WebAssembly.Function({parameters: [], results: ["i32"]}, f);
  assert_not_equals(wrapped, f);
  assert_equals(wrapped(), 1);
  assert_equals(f(), 1);
}, "wrapping a wasm export allocates a new function");

promise_test(async () => {
  assert_implements(WebAssembly.Function, "WebAssembly.Function is not implemented");

  const builder = new WasmModuleBuilder();
  builder.addFunction("f", kSig_i_v)
    .addBody([kExprI32Const, 1])
    .exportFunc();
  const {instance} = await WebAssembly.instantiate(builder.toBuffer());
  const f = instance.exports.f;

  const wrapped = new WebAssembly.Function({parameters: ["i32"], results: []}, f);
  assert_not_equals(wrapped, f);
  assert_equals(wrapped(5), undefined);
  assert_equals(f(), 1);
}, "wrapping a wasm export with a different signature uses that signature");
