// META: global=window,dedicatedworker,jsshell
// META: script=/wasm/jsapi/wasm-module-builder.js

function getExports() {
  const builder = new WasmModuleBuilder();
  builder
    .addFunction("fn", kSig_v_d)
    .addBody([])
    .exportFunc();

  builder.setTableBounds(1);
  builder.addExportOfKind("table", kExternalTable, 0);
  builder.addGlobal(kWasmI32, false).exportAs("global");
  builder.addMemory(4, 8, true);

  const buffer = builder.toBuffer();
  const module = new WebAssembly.Module(buffer);
  const instance = new WebAssembly.Instance(module);
  return instance.exports;
}

test(() => {
  const exports = getExports();

  const builder = new WasmModuleBuilder();
  const functionIndex = builder.addImport("module", "imported", kSig_v_d);
  builder.addExport("exportedFunction", functionIndex);

  const globalIndex = builder.addImportedGlobal("module", "global", kWasmI32);
  builder.addExportOfKind("exportedGlobal", kExternalGlobal, globalIndex);

  builder.addImportedMemory("module", "memory", 4);
  builder.exportMemoryAs("exportedMemory");

  const tableIndex = builder.addImportedTable("module", "table", 1);
  builder.addExportOfKind("exportedTable", kExternalTable, tableIndex);

  const buffer = builder.toBuffer();

  const module = new WebAssembly.Module(buffer);
  const instance = new WebAssembly.Instance(module, {
    "module": {
      "imported": exports.fn,
      "global": exports.global,
      "memory": exports.memory,
      "table": exports.table,
    }
  });

  assert_equals(instance.exports.exportedFunction, exports.fn);
  assert_equals(instance.exports.exportedGlobal, exports.global);
  assert_equals(instance.exports.exportedMemory, exports.memory);
  assert_equals(instance.exports.exportedTable, exports.table);
});

function host_function(f) {
  const builder = new WasmModuleBuilder();
  const functionIndex = builder.addImport("module", "imported", kSig_v_v);
  builder.addExport("exportedFunction", functionIndex);
  const buffer = builder.toBuffer();

  const module = new WebAssembly.Module(buffer);
  const instance = new WebAssembly.Instance(module, {
    "module": {
      "imported": f,
    }
  });
  return { module, hf: instance.exports.exportedFunction };
}

test(() => {
  const f = function() {};
  const { module, hf } = host_function(f);
  assert_not_equals(hf, f);

  const instance2 = new WebAssembly.Instance(module, {
    "module": {
      "imported": hf,
    }
  });
  assert_equals(instance2.exports.exportedFunction, hf);
}, "Comparing two exported host functions");

test(() => {
  const f = function() {};
  const { hf } = host_function(f);

  const argument = { "element": "anyfunc", "initial": 1 };
  const table = new WebAssembly.Table(argument);
  assert_equals(table.get(0), null);
  assert_throws_js(TypeError, () => table.set(0, f));
  assert_equals(table.get(0), null);
  table.set(0, hf);
  assert_equals(table.get(0), hf);
}, "Putting an exported host function in a table");
