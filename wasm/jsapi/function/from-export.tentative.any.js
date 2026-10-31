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

  assert_equals(
    new WebAssembly.Function({parameters: [], results: ["i32"]}, f),
    f
  );
}, "wrapping a wasm export with a matching type is identity");

promise_test(async () => {
  assert_implements(WebAssembly.Function, "WebAssembly.Function is not implemented");

  const builder = new WasmModuleBuilder();
  builder.addFunction("f", kSig_i_v)
    .addBody([kExprI32Const, 1])
    .exportFunc();
  const {instance} = await WebAssembly.instantiate(builder.toBuffer());

  assert_throws_js(
    TypeError,
    () => new WebAssembly.Function({parameters: ["i32"], results: []}, instance.exports.f)
  );
}, "wrapping a wasm export with a mismatched type throws");
