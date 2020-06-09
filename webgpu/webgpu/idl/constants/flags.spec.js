/**
* AUTO-GENERATED - DO NOT EDIT. Source: https://github.com/gpuweb/cts
**/

export const description = `
Test the values of flags interfaces (e.g. GPUTextureUsage).
`;
import { BufferUsage, TextureUsage, ColorWrite, ShaderStage } from '../../../common/constants.js';
import { makeTestGroup } from '../../../common/framework/test_group.js';
import { IDLTest } from '../idl_test.js';
export const g = makeTestGroup(IDLTest);
g.test('BufferUsage').fn(t => {
  const expected = {
    MAP_READ: BufferUsage.MapRead,
    MAP_WRITE: BufferUsage.MapWrite,
    COPY_SRC: BufferUsage.CopySrc,
    COPY_DST: BufferUsage.CopyDst,
    INDEX: BufferUsage.Index,
    VERTEX: BufferUsage.Vertex,
    UNIFORM: BufferUsage.Uniform,
    STORAGE: BufferUsage.Storage,
    INDIRECT: BufferUsage.Indirect
  };
  t.assertMembers(GPUBufferUsage, expected);
});
g.test('TextureUsage').fn(t => {
  const expected = {
    COPY_SRC: TextureUsage.CopySrc,
    COPY_DST: TextureUsage.CopyDst,
    SAMPLED: TextureUsage.Sampled,
    STORAGE: TextureUsage.Storage,
    OUTPUT_ATTACHMENT: TextureUsage.OutputAttachment
  };
  t.assertMembers(GPUTextureUsage, expected);
});
g.test('ColorWrite').fn(t => {
  const expected = {
    RED: ColorWrite.Red,
    GREEN: ColorWrite.Green,
    BLUE: ColorWrite.Blue,
    ALPHA: ColorWrite.Alpha,
    ALL: ColorWrite.All
  };
  t.assertMembers(GPUColorWrite, expected);
});
g.test('ShaderStage').fn(t => {
  const expected = {
    VERTEX: ShaderStage.Vertex,
    FRAGMENT: ShaderStage.Fragment,
    COMPUTE: ShaderStage.Compute
  };
  t.assertMembers(GPUShaderStage, expected);
});
//# sourceMappingURL=flags.spec.js.map