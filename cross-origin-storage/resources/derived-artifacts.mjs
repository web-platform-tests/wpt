// Computations for the derived artifact tests
// (https://wicg.github.io/cross-origin-storage/#derived-artifacts). Every
// `run*()` function reads its source from Cross-Origin Storage once, then
// computes one result for each set of page-chosen inputs it is given, under
// whichever top-level site imported this module. The tests import it both in
// their own document and in a window on another top-level site, so that a
// user agent that reuses an artifact across sites would hand the second site
// the first site's artifact.

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Stores `bytes` under their SHA-256 hash, readable by the listed `origins`,
// and returns the hash value.
export async function store(bytes, origins) {
  const value = await sha256Hex(bytes);
  const handle = await navigator.crossOriginStorage.getFileHandle(
    {algorithm: 'SHA-256', value}, {create: true, origins});
  const writable = await handle.createWritable();
  await writable.write(new Blob([bytes]));
  await writable.close();
  return value;
}

async function read(value) {
  const handle = await navigator.crossOriginStorage.getFileHandle(
    {algorithm: 'SHA-256', value});
  return handle.getFile();
}

// A custom section with a random name, so that each test run compiles bytes
// that no earlier run stored.
function nonceSection() {
  const name = new TextEncoder().encode(`nonce-${Math.random()}`);
  return [0x00, name.length + 1, name.length, ...name];
}

function str(s) {
  const bytes = new TextEncoder().encode(s);
  return [bytes.length, ...bytes];
}

function section(id, content) {
  return [id, content.length, ...content];
}

const WASM_HEADER = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];

// A module that imports `length` from `wasm:js-string` and exports it as
// `len`. With `builtins: ['js-string']` the import is the builtin, and
// otherwise it is whatever the import object supplies.
export function jsStringBuiltinsModule() {
  return new Uint8Array([
    ...WASM_HEADER,
    ...nonceSection(),
    // (type (func (param externref) (result i32)))
    ...section(0x01, [0x01, 0x60, 0x01, 0x6f, 0x01, 0x7f]),
    ...section(0x02, [0x01, ...str('wasm:js-string'), ...str('length'), 0x00, 0x00]),
    ...section(0x03, [0x01, 0x00]),
    ...section(0x07, [0x01, ...str('len'), 0x00, 0x01]),
    // local.get 0, call 0
    ...section(0x0a, [0x01, 0x06, 0x00, 0x20, 0x00, 0x10, 0x00, 0x0b]),
  ]);
}

// A module that imports an immutable externref global `hi` from the module
// named `'` and exports it as `s`. With `importedStringConstants: "'"` the
// global is the string "hi", and otherwise it is whatever the import object
// supplies.
export function stringConstantsModule() {
  return new Uint8Array([
    ...WASM_HEADER,
    ...nonceSection(),
    ...section(0x02, [0x01, ...str("'"), ...str('hi'), 0x03, 0x6f, 0x00]),
    ...section(0x07, [0x01, ...str('s'), 0x03, 0x00]),
  ]);
}

// Compiles the stored module with `compileStreaming()` once per entry of
// `optionsList`, and reports what each compiled module imports and returns.
// Imports left to the import object are satisfied with stand-ins that make a
// wrong module visible: `len()` returns -1 and `s` is "import object".
export async function runWasm(value, optionsList) {
  const file = await read(value);
  const results = [];
  for (const options of optionsList) {
    const module = await WebAssembly.compileStreaming(
      new Response(file, {headers: {'content-type': 'application/wasm'}}), options);
    const imports = WebAssembly.Module.imports(module).map((i) => `${i.module} ${i.name}`);
    const {exports} = await WebAssembly.instantiate(module, {
      'wasm:js-string': {length: () => -1},
      "'": {hi: new WebAssembly.Global({value: 'externref'}, 'import object')},
    });
    results.push({imports, value: exports.len ? exports.len('abcd') : exports.s.value});
  }
  return results;
}

// A compute shader with two entry points whose output depends on the
// pipeline-overridable constant `k`.
export function shader() {
  return new TextEncoder().encode(`// nonce-${Math.random()}
override k: u32 = 1u;
@group(0) @binding(0) var<storage, read_write> out: array<u32, 1>;
@compute @workgroup_size(1) fn a() { out[0] = k * 3u + 1u; }
@compute @workgroup_size(1) fn b() { out[0] = k * 5u + 2u; }
`);
}

// Creates a compute pipeline from the stored shader once per entry of
// `computeList` (a `GPUProgrammableStage` without `module`), runs it, and
// returns the value it writes. Returns {unsupported} if WebGPU is
// unavailable.
export async function runWebGPU(value, computeList) {
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter) {
    return {unsupported: 'WebGPU'};
  }
  const device = await adapter.requestDevice();
  const code = await (await read(value)).text();
  const module = device.createShaderModule({code});
  const results = [];
  for (const compute of computeList) {
    const pipeline = await device.createComputePipelineAsync(
      {layout: 'auto', compute: {module, ...compute}});
    const out = device.createBuffer(
      {size: 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC});
    const readback = device.createBuffer(
      {size: 4, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST});
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{binding: 0, resource: {buffer: out}}],
    }));
    pass.dispatchWorkgroups(1);
    pass.end();
    encoder.copyBufferToBuffer(out, 0, readback, 0, 4);
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    results.push(new Uint32Array(readback.getMappedRange())[0]);
    readback.unmap();
  }
  device.destroy();
  return {results};
}

// Four float32 weights, offset by a random amount so that each test run
// stores bytes that no earlier run stored.
export function weights() {
  const offset = Math.random() / 8;
  return new Float32Array([0.5, 1.5, 2.5, 3.5].map((w) => w + offset));
}

// Builds a WebNN graph `clamp(op(x, w), {minValue: 0, maxValue})` from the
// stored weights `w` once per entry of `graphList` ({op, maxValue}, where `op`
// is 'add' or 'mul'), computes it for `input`, and returns the outputs.
// Returns {unsupported} if WebNN is unavailable.
export async function runWebNN(value, input, graphList) {
  if (!navigator.ml) {
    return {unsupported: 'WebNN'};
  }
  const context = await navigator.ml.createContext();
  const w = new Float32Array(await (await read(value)).arrayBuffer());
  const desc = {dataType: 'float32', shape: [w.length]};
  const results = [];
  for (const {op, maxValue} of graphList) {
    const builder = new MLGraphBuilder(context);
    const x = builder.input('x', desc);
    const out = builder.clamp(builder[op](x, builder.constant(desc, w)), {minValue: 0, maxValue});
    const graph = await builder.build({out});
    const xTensor = await context.createTensor({...desc, writable: true});
    const outTensor = await context.createTensor({...desc, readable: true});
    context.writeTensor(xTensor, new Float32Array(input));
    context.dispatch(graph, {x: xTensor}, {out: outTensor});
    results.push(Array.from(new Float32Array(await context.readTensor(outTensor))));
    graph.destroy();
  }
  context.destroy();
  return {results};
}

// The outputs `runWebNN()` must return, computed in float32.
export function expectedWebNN(w, input, {op, maxValue}) {
  return Array.from(w, (wi, i) => {
    const y = op === 'add' ? Math.fround(input[i] + wi) : Math.fround(input[i] * wi);
    return Math.min(Math.max(y, 0), maxValue);
  });
}
