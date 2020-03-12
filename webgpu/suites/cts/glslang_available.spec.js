/**
* AUTO-GENERATED - DO NOT EDIT. Source: https://github.com/gpuweb/cts
**/

export const description = `
Checks that glslang is available. If glslang is not supposed to be available, suppress this test.
`;
import { initGLSL } from '../../framework/glslang.js';
import { Fixture, TestGroup, unreachable } from '../../framework/index.js';
export const g = new TestGroup(Fixture);
g.test('check', async t => {
  // try{} to prevent the SkipTestCase exception from propagating.
  try {
    await initGLSL();
  } catch (ex) {
    unreachable(String(ex));
  }
});
//# sourceMappingURL=glslang_available.spec.js.map