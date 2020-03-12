/**
* AUTO-GENERATED - DO NOT EDIT. Source: https://github.com/gpuweb/cts
**/

import { getGlslangPath } from './glslang_path.js';
import { SkipTestCase } from './index.js';
import { assert } from './util/index.js';
let glslangAttempted = false;
let glslangInstance;
export async function initGLSL() {
  if (glslangAttempted) {
    if (!glslangInstance) {
      throw new SkipTestCase('glslang is not available');
    }
  } else {
    glslangAttempted = true;
    const glslangPath = getGlslangPath() || '../glslang.js';
    let glslangModule;

    try {
      glslangModule = (await import(glslangPath)).default;
    } catch (ex) {
      throw new SkipTestCase('glslang is not available');
    }

    const glslang = await glslangModule();
    glslangInstance = glslang;
  }
}
export function compileGLSL(glsl, shaderType, genDebug, spirvVersion) {
  assert(glslangInstance !== undefined, 'GLSL compiler is not instantiated. Run `await initGLSL()` first');
  return glslangInstance.compileGLSL(glsl, shaderType, genDebug, spirvVersion);
}
//# sourceMappingURL=glslang.js.map