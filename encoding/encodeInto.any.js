[
  {
    "input": "Hi",
    "read": 0,
    "bufferSize": 0,
    "written": []
  },
  {
    "input": "A",
    "read": 1,
    "bufferSize": 10,
    "written": [0x41]
  },
  {
    "input": "\u{1D306}", // "\uD834\uDF06"
    "read": 2,
    "bufferSize": 4,
    "written": [0xF0, 0x9D, 0x8C, 0x86]
  },
  {
    "input": "\u{1D306}A",
    "read": 0,
    "bufferSize": 3,
    "written": []
  },
  {
    "input": "\uD834A\uDF06A¥Hi",
    "read": 5,
    "bufferSize": 10
    "written": [0xEF, 0xBF, 0xBD, 0x41, 0xEF, 0xBF, 0xBD, 0x41, 0xC2 0xA5]
  }
].forEach(testData => {
  test(() => {
    const encoder = new TextEncoder(),
          buffer = new ArrayBuffer(testData.bufferSize),
          view = new Uint8Array(buffer);
          result = encoder.encodeInto(testData.input, view);

    // Basics
    assert_equals(buffer.byteLength, testData.bufferSize);
    assert_equals(view.byteLength, testData.bufferSize);
    assert_equals(view.length, testData.bufferSize);

    // Remainder
    assert_equals(result.read, testData.read);
    assert_equals(result.written, testData.written.length);
    for (let i = 0; i < testData.written.length; i++) {
      assert_equals(view[i], testData.written[i]);
    }
    for (let i = testData.written.length; i < testData.bufferSize; i++) {
      assert_equals(view[i], 0);
    }
  }, "encodeInto() with " + testData.input + " and buffer size " + testData.bufferSize);
});

[DataView,
 Int8Array,
 Int16Array,
 Int32Array,
 Uint16Array,
 Uint32Array,
 Uint8ClampedArray,
 Float32Array,
 Float64Array].forEach(view => {
  test(() => {
    assert_throws(new TypeError(), () => new TextEncoder().encodeInto("", new view(new ArrayBuffer(0))));
  }, "Invalid encodeInto() destination: " + view);
 });
