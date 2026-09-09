(module
  (import "./exnref-export.wasm" "exnrefExport" (global $g exnref))
  (export "reexportedExnrefExport" (global $g)))
