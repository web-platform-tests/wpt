import * as mod from "./worker.wasm";
import source modSource from "./worker.wasm";
assert_true(modSource instanceof WebAssembly.Module);
assert_true(await import("./worker.wasm") === mod);
assert_true(await import.source("./worker.wasm") === modSource);
