// META: global=window,dedicatedworker
// META: timeout=long
// Decoded VideoFrames backed by YUV media must report their native YUV
// format and copyTo must return the decoded planes (bug 1969762).

const WIDTH = 320;
const HEIGHT = 240;
// The canvas is filled with rgb(64, 128, 64). BT.601 limited range luma:
// Y = 16 + 0.257*R + 0.504*G + 0.098*B, so roughly 103. BT.709 gives a
// nearby value; the assertion tolerance covers both and codec loss.
const FILL_R = 64, FILL_G = 128, FILL_B = 64;

async function encodeFrames(codec) {
  const cfg = {
    codec,
    width: WIDTH,
    height: HEIGHT,
    bitrate: 1000000,
    framerate: 24,
  };
  const support = await VideoEncoder.isConfigSupported(cfg);
  if (!support.supported) {
    return null;
  }
  const chunks = [];
  let decoderConfig = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      chunks.push(chunk);
      if (meta && meta.decoderConfig) {
        decoderConfig = meta.decoderConfig;
      }
    },
    error: () => {},
  });
  encoder.configure(cfg);
  const canvas = new OffscreenCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = `rgb(${FILL_R}, ${FILL_G}, ${FILL_B})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const frame = new VideoFrame(canvas, { timestamp: i * 41667 });
    encoder.encode(frame, { keyFrame: i === 0 });
    frame.close();
  }
  await encoder.flush();
  encoder.close();
  return { chunks, decoderConfig };
}

async function decodeFirstFrame(codec, acceleration) {
  const encoded = await encodeFrames(codec);
  if (!encoded || !encoded.chunks.length) {
    return null;
  }
  const cfg = Object.assign(
    encoded.decoderConfig ?? { codec, codedWidth: WIDTH, codedHeight: HEIGHT },
    { hardwareAcceleration: acceleration }
  );
  const support = await VideoDecoder.isConfigSupported(cfg);
  if (!support.supported) {
    return null;
  }
  let firstFrame = null;
  const decoder = new VideoDecoder({
    output: frame => {
      if (!firstFrame) {
        firstFrame = frame;
      } else {
        frame.close();
      }
    },
    error: () => {},
  });
  decoder.configure(cfg);
  for (const chunk of encoded.chunks) {
    decoder.decode(chunk);
  }
  await decoder.flush();
  decoder.close();
  return firstFrame;
}

for (const codec of ["avc1.42001f", "vp8"]) {
  for (const acceleration of ["prefer-software", "no-preference"]) {
    promise_test(async t => {
      const frame = await decodeFirstFrame(codec, acceleration);
      assert_implements_optional(
        frame,
        `${codec} encode+decode available in this build`
      );
      t.add_cleanup(() => frame.close());

      assert_in_array(
        frame.format,
        ["I420", "NV12"],
        "decoded frame must report a YUV format, not an RGB conversion"
      );

      assert_not_equals(frame.colorSpace.matrix, null, "matrix is set");
      assert_not_equals(frame.colorSpace.fullRange, null, "range is set");

      const size = frame.allocationSize();
      const expectedPlanes = frame.format === "I420" ? 3 : 2;
      const data = new Uint8Array(size);
      const layout = await frame.copyTo(data);
      assert_equals(layout.length, expectedPlanes, "plane count");

      // Solid fill: the whole Y plane should sit near the expected luma.
      const yExpected = 16 + 0.257 * FILL_R + 0.504 * FILL_G + 0.098 * FILL_B;
      const y0 = layout[0].offset;
      let min = 255, max = 0;
      for (let row = 0; row < frame.codedHeight; row += 16) {
        for (let col = 0; col < frame.codedWidth; col += 16) {
          const v = data[y0 + row * layout[0].stride + col];
          min = Math.min(min, v);
          max = Math.max(max, v);
        }
      }
      assert_less_than(Math.abs(min - yExpected), 24, `Y min ${min} near ${yExpected}`);
      assert_less_than(Math.abs(max - yExpected), 24, `Y max ${max} near ${yExpected}`);
    }, `${codec} ${acceleration}: decoded frame reports YUV and copies real planes`);
  }
}
