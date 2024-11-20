// Feature detection.
// MessagePort is not Exposed=*, so skip MessagePort-specific tests if it is not
// present.
// Streams, e.g. ReadableStream, are both Exposed=* and Transferable, but the
// transferability is not widely implemented.
// For tests that need _any_ transferable object, use one or the other in order
// to make the test as useful as possible. If neither is available, skip the
// test since transferability of streams is not specifically being tested here.
// There are tests specifically for the transferability of streams in
// streams/transferable/.

const environmentHasMessagePort = typeof globalThis.MessagePort !== 'undefined' &&
  typeof globalThis.MessageChannel !== 'undefined';

function readableStreamIsTransferable() {
  try {
    const stream = new ReadableStream();
    structuredClone(stream, [stream]);
    return true;
  } catch(err) {
    if (err instanceof DOMException && err.code === DOMException.DATA_CLONE_ERR) {
      return false;
    }
    throw err;
  }
}

structuredCloneBatteryOfTests.push({
  description: 'ArrayBuffer',
  async f(runner) {
    const buffer = new Uint8Array([1]).buffer;
    const copy = await runner.structuredClone(buffer, [buffer]);
    assert_equals(buffer.byteLength, 0);
    assert_equals(copy.byteLength, 1);
  }
});

if (environmentHasMessagePort) {
  structuredCloneBatteryOfTests.push({
    description: 'MessagePort',
    async f(runner) {
      const {port1, port2} = new MessageChannel();
      const copy = await runner.structuredClone(port2, [port2]);
      const msg = new Promise(resolve => port1.onmessage = resolve);
      copy.postMessage('ohai');
      assert_equals((await msg).data, 'ohai');
    }
  });
}

// TODO: ImageBitmap

structuredCloneBatteryOfTests.push({
  description: 'A detached ArrayBuffer cannot be transferred',
  async f(runner, t) {
    const buffer = new ArrayBuffer();
    await runner.structuredClone(buffer, [buffer]);
    await promise_rejects_dom(
      t,
      "DataCloneError",
      runner.structuredClone(buffer, [buffer])
    );
  }
});

structuredCloneBatteryOfTests.push({
  description: 'A detached platform object cannot be transferred',
  async f(runner, t) {
    let xferable;
    if (environmentHasMessagePort) {
      xferable = new MessageChannel().port1;
    } else if (readableStreamIsTransferable()) {
      xferable = new ReadableStream();
    } else {
      throw new OptionalFeatureUnsupportedError('No suitable exposed and transferable platform object to test');
    }
    await runner.structuredClone(xferable, [xferable]);
    await promise_rejects_dom(
      t,
      "DataCloneError",
      runner.structuredClone(xferable, [xferable])
    );
  }
});

structuredCloneBatteryOfTests.push({
  description: 'Transferring a non-transferable platform object fails',
  async f(runner, t) {
    const exc = new DOMException();
    await promise_rejects_dom(
      t,
      "DataCloneError",
      runner.structuredClone(exc, [exc])
    );
  },
});

structuredCloneBatteryOfTests.push({
  description: 'An object whose interface is deleted from the global object must still be received',
  async f(runner) {
    let xferable, iface, globalPropName;
    if (environmentHasMessagePort) {
      xferable = new MessageChannel().port1;
      iface = globalThis.MessagePort;
      globalPropName = 'MessagePort';
    } else if (readableStreamIsTransferable()) {
      xferable = new ReadableStream();
      iface = globalThis.ReadableStream;
      globalPropName = 'ReadableStream';
    } else {
      throw new OptionalFeatureUnsupportedError('No suitable exposed and transferable platform object to test');
    }
    delete globalThis[globalPropName];
    try {
      const transfer = await runner.structuredClone(xferable, [xferable]);
      assert_true(transfer instanceof iface);
    } finally {
      globalThis[globalPropName] = iface;
    }
  }
});

structuredCloneBatteryOfTests.push({
  description: 'A subclass instance will be received as its closest transferable superclass',
  async f(runner) {
    // MessagePort doesn't have a constructor, so we must use something else.

    if (!readableStreamIsTransferable()) {
      throw new OptionalFeatureUnsupportedError('No suitable subclassable, exposed, and transferable platform object to test');
    }

    class ReadableStreamSubclass extends ReadableStream {}
    const original = new ReadableStreamSubclass();
    const transfer = await runner.structuredClone(original, [original]);
    assert_equals(Object.getPrototypeOf(transfer), ReadableStream.prototype);
  }
});

structuredCloneBatteryOfTests.push({
  description: 'Resizable ArrayBuffer is transferable',
  async f(runner) {
    const buffer = new ArrayBuffer(16, { maxByteLength: 1024 });
    const copy = await runner.structuredClone(buffer, [buffer]);
    assert_equals(buffer.byteLength, 0);
    assert_equals(copy.byteLength, 16);
    assert_equals(copy.maxByteLength, 1024);
    assert_true(copy.resizable);
  }
});

structuredCloneBatteryOfTests.push({
  description: 'Length-tracking TypedArray is transferable',
  async f(runner) {
    const ab = new ArrayBuffer(16, { maxByteLength: 1024 });
    const ta = new Uint8Array(ab);
    const copy = await runner.structuredClone(ta, [ab]);
    assert_equals(ab.byteLength, 0);
    assert_equals(copy.buffer.byteLength, 16);
    assert_equals(copy.buffer.maxByteLength, 1024);
    assert_true(copy.buffer.resizable);
    copy.buffer.resize(32);
    assert_equals(copy.byteLength, 32);
  }
});

structuredCloneBatteryOfTests.push({
  description: 'Length-tracking DataView is transferable',
  async f(runner) {
    const ab = new ArrayBuffer(16, { maxByteLength: 1024 });
    const dv = new DataView(ab);
    const copy = await runner.structuredClone(dv, [ab]);
    assert_equals(ab.byteLength, 0);
    assert_equals(copy.buffer.byteLength, 16);
    assert_equals(copy.buffer.maxByteLength, 1024);
    assert_true(copy.buffer.resizable);
    copy.buffer.resize(32);
    assert_equals(copy.byteLength, 32);
  }
});

structuredCloneBatteryOfTests.push({
  description: 'Transferring OOB TypedArray throws',
  async f(runner, t) {
    const ab = new ArrayBuffer(16, { maxByteLength: 1024 });
    const ta = new Uint8Array(ab, 8);
    ab.resize(0);
    await promise_rejects_dom(
      t,
      "DataCloneError",
      runner.structuredClone(ta, [ab])
    );
  }
});

structuredCloneBatteryOfTests.push({
  description: 'Transferring OOB DataView throws',
  async f(runner, t) {
    const ab = new ArrayBuffer(16, { maxByteLength: 1024 });
    const dv = new DataView(ab, 8);
    ab.resize(0);
    await promise_rejects_dom(
      t,
      "DataCloneError",
      runner.structuredClone(dv, [ab])
    );
  }
});
