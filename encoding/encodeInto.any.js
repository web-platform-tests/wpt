function getDestination(bufferSize, viewOffset, viewLength) {
  const buffer = new ArrayBuffer(bufferSize);
  return [buffer, new Uint8Array(buffer, viewOffset, viewLength)];
}

function getFilledDestination(bufferSize, viewOffset, viewLength, filler) {
  const [buffer, view] = getDestination(bufferSize, viewOffset, viewLength),
        fullView = new Uint8Array(buffer),
        control = new Array(bufferSize);
  let byte = filler;
  for (let i = 0; i < bufferSize; i++) {
    if (filler === "random") {
      byte = Math.floor(Math.random() * 256);
    }
    control[i] = byte;
    fullView[i] = byte;
  }
  return [buffer, view, fullView, control];
}

[
  {
    "input": "Hi",
    "read": 0,
    "destinationLength": 0,
    "written": []
  },
  {
    "input": "A",
    "read": 1,
    "destinationLength": 10,
    "written": [0x41]
  },
  {
    "input": "\u{1D306}", // "\uD834\uDF06"
    "read": 2,
    "destinationLength": 4,
    "written": [0xF0, 0x9D, 0x8C, 0x86]
  },
  {
    "input": "\u{1D306}A",
    "read": 0,
    "destinationLength": 3,
    "written": []
  },
  {
    "input": "\uD834A\uDF06A¥Hi",
    "read": 5,
    "destinationLength": 10,
    "written": [0xEF, 0xBF, 0xBD, 0x41, 0xEF, 0xBF, 0xBD, 0x41, 0xC2, 0xA5]
  },
  {
    "input": "A\uDF06",
    "read": 2,
    "destinationLength": 4,
    "written": [0x41, 0xEF, 0xBF, 0xBD]
  },
  {
    "input": "¥¥",
    "read": 2,
    "destinationLength": 4,
    "written": [0xC2, 0xA5, 0xC2, 0xA5]
  }
].forEach(testData => {
  [
    {
      "bufferIncrease": 0,
      "destinationOffset": 0,
      "filler": 0
    },
    {
      "bufferIncrease": 10,
      "destinationOffset": 4,
      "filler": 0
    },
    {
      "bufferIncrease": 0,
      "destinationOffset": 0,
      "filler": 0x80
    },
    {
      "bufferIncrease": 10,
      "destinationOffset": 4,
      "filler": 0x80
    },
    {
      "bufferIncrease": 0,
      "destinationOffset": 0,
      "filler": "random"
    },
    {
      "bufferIncrease": 10,
      "destinationOffset": 4,
      "filler": "random"
    }
  ].forEach(destinationData => {
    test(() => {
      const encoder = new TextEncoder(),
            [buffer, view, fullView, control] = getFilledDestination(testData.destinationLength + destinationData.bufferIncrease, destinationData.destinationOffset, testData.destinationLength, destinationData.filler),
            result = encoder.encodeInto(testData.input, view);

      // Basics
      assert_equals(view.byteLength, testData.destinationLength);
      assert_equals(view.length, testData.destinationLength);

      // Remainder
      assert_equals(result.read, testData.read);
      assert_equals(result.written, testData.written.length);
      for (let i = 0; i < testData.destinationLength + destinationData.bufferIncrease; i++) {
        if (i < destinationData.destinationOffset || i > (destinationData.destinationOffset + testData.written.length)) {
          assert_equals(fullView[i], control[i]);
        } else {
          assert_equals(fullView[i], testData.written[i - destinationData.destinationOffset]);
        }
      }
    }, "encodeInto() with " + testData.input + " and destination length " + testData.destinationLength + ", offset " + destinationData.destinationOffset + ", filler " + destinationData.filler);
  });
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
