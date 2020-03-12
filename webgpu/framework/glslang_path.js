/**
* AUTO-GENERATED - DO NOT EDIT. Source: https://github.com/gpuweb/cts
**/

import { assert } from './util/index.js';
let glslangPath;
export function getGlslangPath() {
  return glslangPath;
}
export function setGlslangPath(path) {
  assert(path.startsWith('/'), 'glslang path must be absolute');
  glslangPath = path;
}
//# sourceMappingURL=glslang_path.js.map