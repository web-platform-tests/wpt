function createBuffer(type, length = 0) {
  if (type === "ArrayBuffer") {
    return new ArrayBuffer(length);
  } else {
    // See https://github.com/whatwg/html/issues/5380 for why not `new SharedArrayBuffer()`
    const sabConstructor = new WebAssembly.Memory({ shared:true, initial:0, maximum:0 }).buffer.constructor;
    return new sabConstructor(length);
  }
}

["ArrayBuffer", "SharedArrayBuffer"].forEach(arrayBufferOrSharedArrayBuffer => {
  test(() => {
    const buf = createBuffer(arrayBufferOrSharedArrayBuffer, 2);
    const view = new Uint8Array(buf);
    const buf2 = createBuffer(arrayBufferOrSharedArrayBuffer, 2);
    const view2 = new Uint8Array(buf2);
    const decoder = new TextDecoder("utf-8");
    view[0] = 0xEF;
    view[1] = 0xBB;
    view2[0] = 0xBF;
    view2[1] = 0x40;
    assert_equals(decoder.decode(buf, {stream:true}), "");
    view[0] = 0x01;
    view[1] = 0x02;
    assert_equals(decoder.decode(buf2), "@");
  }, "Modify buffer after passing it in (" + arrayBufferOrSharedArrayBuffer  + ")");
});
