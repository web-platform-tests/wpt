// META: global=window,dedicatedworker,jsshell
// META: script=/common/sab.js
// META: script=/wasm/jsapi/wasm-module-builder.js

// WebAssembly.validate() and WebAssembly.compile() take an
// [AllowResizable] AllowSharedBufferSource as input, and copy their input
// using Web IDL's "get a copy of the bytes held by the buffer source"
// algorithm, along with the "byte length" and "byte offset" algorithms
// that algorithm builds on.
//
// These tests exercise these Web IDL algorithms across every combination of
// shared, resizable, length-tracking, out-of-bounds and detached buffers.
//
// https://webidl.spec.whatwg.org/#dfn-get-buffer-source-copy
// https://webidl.spec.whatwg.org/#dfn-BufferSource-byte-length

function assert_Module(module) {
  assert_equals(Object.getPrototypeOf(module), WebAssembly.Module.prototype,
                "Prototype");
  assert_true(Object.isExtensible(module), "Extensibility");
}

let emptyModuleBinary;
setup(() => {
  emptyModuleBinary = new WasmModuleBuilder().toBuffer();
});

// |makeBufferSource| is a factory rather than a value so that every test gets
// its own buffer: several of these tests resize or detach what they are given.

function testValidModule(makeBufferSource, description) {
  test(() => {
    assert_true(WebAssembly.validate(makeBufferSource()));
  }, `WebAssembly.validate() accepts ${description}`);

  promise_test(() => {
    return WebAssembly.compile(makeBufferSource()).then(assert_Module);
  }, `WebAssembly.compile() accepts ${description}`);
}

// The bytes are read successfully, but they do not form a valid module. This is
// distinct from the buffer source itself being rejected, which would be a
// TypeError.
function testEmptyModule(makeBufferSource, description) {
  test(() => {
    assert_false(WebAssembly.validate(makeBufferSource()));
  }, `WebAssembly.validate() returns false (and does not throw) for ${description}`);

  promise_test(t => {
    return promise_rejects_js(t, WebAssembly.CompileError,
                              WebAssembly.compile(makeBufferSource()));
  }, `WebAssembly.compile() rejects with a CompileError for ${description}`);
}

function testTypeError(makeBufferSource, description) {
  test(() => {
    assert_throws_js(TypeError, () => WebAssembly.validate(makeBufferSource()));
  }, `WebAssembly.validate() throws a TypeError for ${description}`);

  promise_test(t => {
    return promise_rejects_js(t, TypeError, WebAssembly.compile(makeBufferSource()));
  }, `WebAssembly.compile() rejects with a TypeError for ${description}`);
}

// Buffers passed directly, exercising "byte length" for buffer types.

testValidModule(() => {
  const rab = new ArrayBuffer(emptyModuleBinary.length,
                              { maxByteLength: emptyModuleBinary.length + 16 });
  new Uint8Array(rab).set(emptyModuleBinary);
  return rab;
}, "a resizable ArrayBuffer");

testValidModule(() => {
  const sab = createBuffer("SharedArrayBuffer", emptyModuleBinary.length);
  new Uint8Array(sab).set(emptyModuleBinary);
  return sab;
}, "a SharedArrayBuffer");

testValidModule(() => {
  const gsab = createBuffer("SharedArrayBuffer", emptyModuleBinary.length,
                            { maxByteLength: emptyModuleBinary.length + 16 });
  new Uint8Array(gsab).set(emptyModuleBinary);
  return gsab;
}, "a growable SharedArrayBuffer");

// Length-tracking views, exercising TypedArrayByteLength and GetViewByteLength
// rather than a fixed [[ByteLength]].

testValidModule(() => {
  const rab = new ArrayBuffer(emptyModuleBinary.length,
                              { maxByteLength: emptyModuleBinary.length + 16 });
  new Uint8Array(rab).set(emptyModuleBinary);
  return new Uint8Array(rab);
}, "a length-tracking Uint8Array on a resizable ArrayBuffer");

testValidModule(() => {
  const rab = new ArrayBuffer(emptyModuleBinary.length,
                              { maxByteLength: emptyModuleBinary.length + 16 });
  new Uint8Array(rab).set(emptyModuleBinary);
  return new DataView(rab);
}, "a length-tracking DataView on a resizable ArrayBuffer");

testValidModule(() => {
  const gsab = createBuffer("SharedArrayBuffer", emptyModuleBinary.length,
                            { maxByteLength: emptyModuleBinary.length + 16 });
  new Uint8Array(gsab).set(emptyModuleBinary);
  return new Uint8Array(gsab);
}, "a length-tracking Uint8Array on a growable SharedArrayBuffer");

testValidModule(() => {
  const gsab = createBuffer("SharedArrayBuffer", emptyModuleBinary.length,
                            { maxByteLength: emptyModuleBinary.length + 16 });
  new Uint8Array(gsab).set(emptyModuleBinary);
  return new DataView(gsab);
}, "a length-tracking DataView on a growable SharedArrayBuffer");

// Views at a non-zero byte offset, exercising "byte offset".

testValidModule(() => {
  const rab = new ArrayBuffer(4 + emptyModuleBinary.length,
                              { maxByteLength: 4 + emptyModuleBinary.length });
  new Uint8Array(rab).set(emptyModuleBinary, 4);
  return new Uint8Array(rab, 4);
}, "a Uint8Array at a non-zero byte offset in a resizable ArrayBuffer");

testValidModule(() => {
  const rab = new ArrayBuffer(4 + emptyModuleBinary.length,
                              { maxByteLength: 4 + emptyModuleBinary.length });
  new Uint8Array(rab).set(emptyModuleBinary, 4);
  return new DataView(rab, 4, emptyModuleBinary.length);
}, "a DataView at a non-zero byte offset in a resizable ArrayBuffer");

testValidModule(() => {
  const gsab = createBuffer("SharedArrayBuffer", 4 + emptyModuleBinary.length,
                            { maxByteLength: 4 + emptyModuleBinary.length });
  new Uint8Array(gsab).set(emptyModuleBinary, 4);
  return new Uint8Array(gsab, 4);
}, "a Uint8Array at a non-zero byte offset in a growable SharedArrayBuffer");

// The byte length must be read at the time of the call, not cached.

test(() => {
  const length = emptyModuleBinary.length;
  const rab = new ArrayBuffer(length, { maxByteLength: length });
  new Uint8Array(rab).set(emptyModuleBinary);
  const view = new Uint8Array(rab);

  assert_true(WebAssembly.validate(view), "before resizing");
  rab.resize(4);
  assert_false(WebAssembly.validate(view), "after shrinking past the module header");
  // Shrinking zeroes out the discarded bytes, so they have to be written again.
  rab.resize(length);
  new Uint8Array(rab).set(emptyModuleBinary);
  assert_true(WebAssembly.validate(view), "after growing back");
}, "Resizing an ArrayBuffer changes what a length-tracking Uint8Array holds");

test(() => {
  const length = emptyModuleBinary.length;
  const gsab = createBuffer("SharedArrayBuffer", 4, { maxByteLength: length });
  const view = new Uint8Array(gsab);

  assert_false(WebAssembly.validate(view), "before growing");
  gsab.grow(length);
  new Uint8Array(gsab).set(emptyModuleBinary);
  assert_true(WebAssembly.validate(view), "after growing");
}, "Growing a SharedArrayBuffer changes what a length-tracking Uint8Array holds");

// %TypedArray%.prototype.byteLength and %TypedArray%.prototype.byteOffset both
// report 0 for an out-of-bounds typed array rather than throwing, so Web IDL
// copies zero bytes from one and the module comes out empty.

testEmptyModule(() => {
  const rab = new ArrayBuffer(8, { maxByteLength: 8 });
  const view = new Uint8Array(rab, 4);
  rab.resize(2);
  return view;
}, "an out-of-bounds Uint8Array");

testEmptyModule(() => {
  const rab = new ArrayBuffer(8, { maxByteLength: 8 });
  const view = new Uint8Array(rab, 4, 2);
  rab.resize(2);
  return view;
}, "an out-of-bounds fixed-length Uint8Array");

// DataView is the exception: DataView.prototype.byteLength and
// DataView.prototype.byteOffset throw for an out-of-bounds view, so the copy
// fails and the TypeError is propagated to the caller.

testTypeError(() => {
  const rab = new ArrayBuffer(8, { maxByteLength: 8 });
  const view = new DataView(rab, 4);
  rab.resize(2);
  return view;
}, "an out-of-bounds DataView");

// Detachedness is checked before the byte length is read, so a detached
// DataView is treated as empty even though DataView.prototype.byteLength would
// throw for it. This is the one case where an out-of-bounds DataView does not
// produce a TypeError.

testEmptyModule(() => {
  const ab = new ArrayBuffer(emptyModuleBinary.length);
  new Uint8Array(ab).set(emptyModuleBinary);
  const view = new Uint8Array(ab);
  ab.transfer();
  return view;
}, "a detached Uint8Array");

testEmptyModule(() => {
  const ab = new ArrayBuffer(emptyModuleBinary.length);
  new Uint8Array(ab).set(emptyModuleBinary);
  const view = new DataView(ab);
  ab.transfer();
  return view;
}, "a detached DataView");

testEmptyModule(() => {
  const ab = new ArrayBuffer(emptyModuleBinary.length);
  new Uint8Array(ab).set(emptyModuleBinary);
  ab.transfer();
  return ab;
}, "a detached ArrayBuffer");
