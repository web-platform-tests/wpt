// META: title=WebAssembly ESM integration with dynamic source phase imports
// META: global=window,dedicatedworker,shadowrealm-in-window,shadowrealm-in-shadowrealm,shadowrealm-in-dedicatedworker,shadowrealm-in-sharedworker

// Tests the same things as source-phase.tentative.html in this folder, but with
// dynamic import and in multiple globals

promise_test(async () => {
  const exportedNamesSource = await import.source("./resources/exported-names.wasm");
  assert_true(exportedNamesSource instanceof WebAssembly.Module,
    "Source import should be a WebAssembly.Module");

  const AbstractModuleSource = Object.getPrototypeOf(WebAssembly.Module);
  assert_equals(AbstractModuleSource.name, "AbstractModuleSource",
    "AbstractModuleSource name property");
  assert_true(exportedNamesSource instanceof AbstractModuleSource,
    "Source import should be an AbstractModuleSource");

  assert_array_equals(WebAssembly.Module.exports(exportedNamesSource).map(({ name }) => name).sort(),
    ["func", "glob", "mem", "tab"],
    "Exports should be correct");
}, "Exported names");

promise_test(async () => {
  const wasmImportFromWasmSource = await import.source("./resources/wasm-import-from-wasm.wasm");
  assert_true(wasmImportFromWasmSource instanceof WebAssembly.Module,
    "Source import should be a WebAssembly.Module");

  let logged = false;
  const instance = await WebAssembly.instantiate(wasmImportFromWasmSource, {
    "./wasm-export-to-wasm.wasm": {
      log() {
        logged = true;
      }
    }
  });
  instance.exports.logExec();
  assert_true(logged, "Calls into JS import");
}, "Instantiated module");
