// META: global=window,dedicatedworker,jsshell,shadowrealm
// META: script=/wasm/jsapi/wasm-module-builder.js
// META: script=/wasm/jsapi/assertions.js

let emptyModuleBinary;
setup(() => {
  emptyModuleBinary = new WasmModuleBuilder().toBuffer();
});

test(() => {
  assert_equals(typeof AbstractModuleSource, "undefined");
  const AbstractModuleSource = Object.getPrototypeOf(WebAssembly.Module).constructor;
  assert_equals(AbstractModuleSource.name, "AbstractModuleSource");
  assert_not_equals(AbstractModuleSource, Function);
}, "AbstractModuleSource intrinsic");

test(() => {
  const AbstractModuleSourceProto = Object.getPrototypeOf(WebAssembly.Module.prototype).constructor;
  assert_not_equals(AbstractModuleSourceProto, Object);
}, "AbstractModuleSourceProto intrinsic");

test(() => {
  const builder = new WasmModuleBuilder();

  builder
    .addFunction("fn", kSig_v_v)
    .addBody([])
    .exportFunc();
  builder.addMemory(0, 256, true);

  const buffer = builder.toBuffer()
  const module = new WebAssembly.Module(buffer);

  const AbstractModuleSource = Object.getPrototypeOf(WebAssembly.Module).constructor;
  const toStringTag = Object.getOwnPropertyDescriptor(AbstractModuleSource.prototype, Symbol.toStringTag).get;
  assert_equals(toStringTag.call(module), "WebAssembly.Module");
}, "AbstractModuleSourceProto toStringTag brand check");
