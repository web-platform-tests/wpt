// META: global=jsshell
// META: script=/wasm/jsapi/wasm-module-builder.js

promise_test(async t => {
  const builder = new WasmModuleBuilder();
  builder.addImportedMemory("module", "memory", 0, 128);
  builder.exportMemoryAs("exported");
  const buffer = builder.toBuffer()

  const memory = new WebAssembly.Memory({ initial: 0, maximum: 128 });
  const {instance} = await WebAssembly.instantiate(buffer, {
    module: { memory }
  });
  assert_equals(instance.exports.exported, memory);
}, "Memory");

promise_test(async t => {
  const builder = new WasmModuleBuilder();
  builder.addImportedTable("module", "table", 0, 128);
  builder.addExportOfKind("exported", kExternalTable, 0);
  const buffer = builder.toBuffer()

  const table = new WebAssembly.Table({ element: "funcref", initial: 0, maximum: 128 });
  const {instance} = await WebAssembly.instantiate(buffer, {
    module: { table }
  });
  assert_equals(instance.exports.exported, table);
}, "Table");

async function exported_fun() {
  const builder = new WasmModuleBuilder();
  const index = builder.addImport("module", "fun", kSig_v_v);
  builder.addExport("exported", index);
  const buffer = builder.toBuffer()

  const fun = function() {};
  const {instance} = await WebAssembly.instantiate(buffer, {
    module: { fun }
  });
  return instance.exports.exported;
}

promise_test(async t => {
  const builder = new WasmModuleBuilder();
  const index = builder.addImport("module", "fun", kSig_v_v);
  builder.addExport("exported", index);
  const buffer = builder.toBuffer()

  const fun = await exported_fun();
  const {instance} = await WebAssembly.instantiate(buffer, {
    module: { fun }
  });
  assert_equals(instance.exports.exported, fun);
}, "Function");

promise_test(async t => {
  const builder = new WasmModuleBuilder();
  const index = builder.addImportedGlobal("module", "global", kWasmI32);
  builder.addExportOfKind("exported", kExternalGlobal, index);
  const buffer = builder.toBuffer()

  const global = new WebAssembly.Global({ value: "i32" }, 7);
  const {instance} = await WebAssembly.instantiate(buffer, {
    module: { global }
  });
  assert_equals(instance.exports.exported, global);
}, "Global");
