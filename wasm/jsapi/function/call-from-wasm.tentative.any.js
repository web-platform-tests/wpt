// META: global=window,dedicatedworker,jsshell
// META: script=/wasm/jsapi/assertions.js
// META: script=/wasm/jsapi/wasm-module-builder.js

promise_test(async () => {
  assert_implements(WebAssembly.Function, "WebAssembly.Function is not implemented");

  const fun = new WebAssembly.Function({parameters: [], results: ["i32"]}, () => 7);
  const builder = new WasmModuleBuilder();
  const idx = builder.addImport("m", "fun", kSig_i_v);
  builder.addExport("fun1", idx);
  builder.addFunction("main", kSig_i_v)
    .addBody([kExprCallFunction, idx])
    .exportFunc();

  const {instance} = await WebAssembly.instantiate(builder.toBuffer(), {m: {fun}});
  assert_equals(instance.exports.main(), 7);
  assert_equals(instance.exports.fun1, fun);
}, "imported WebAssembly.Function can be called from wasm and re-exported as itself");

promise_test(async () => {
  assert_implements(WebAssembly.Function, "WebAssembly.Function is not implemented");

  const table = new WebAssembly.Table({element: "anyfunc", initial: 1});
  const fun = new WebAssembly.Function({parameters: [], results: ["i32"]}, () => 42);
  table.set(0, fun);

  const builder = new WasmModuleBuilder();
  builder.addImportedTable("m", "table", 1);
  const type = builder.addType(kSig_i_v);
  builder.addFunction("main", kSig_i_v)
    .addBody([kExprI32Const, 0, kExprCallIndirect, type, 0])
    .exportFunc();

  const {instance} = await WebAssembly.instantiate(builder.toBuffer(), {m: {table}});
  assert_equals(instance.exports.main(), 42);
}, "call_indirect through a table entry that is a WebAssembly.Function");
