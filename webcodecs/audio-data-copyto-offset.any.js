// META: global=window,dedicatedworker

test(t => {
  // 2 channels, 10 frames, interleaved f32.
  // Layout: [L0, R0, L1, R1, L2, R2, L3, R3, L4, R4,
  //          L5, R5, L6, R6, L7, R7, L8, R8, L9, R9]
  const channels = 2;
  const frames = 10;
  const data = new Float32Array(channels * frames);
  for (let i = 0; i < frames; i++) {
    data[i * channels] = i * 0.1;           // left
    data[i * channels + 1] = -(i * 0.1);    // right
  }

  const audioData = new AudioData({
    timestamp: 0,
    data: data,
    numberOfFrames: frames,
    numberOfChannels: channels,
    sampleRate: 44100,
    format: 'f32',
  });
  t.add_cleanup(() => audioData.close());

  const frameOffset = 3;
  const frameCount = 5;
  const dest = new Float32Array(channels * frameCount);
  audioData.copyTo(dest, {
    planeIndex: 0,
    format: 'f32',
    frameOffset: frameOffset,
    frameCount: frameCount,
  });

  // Expected: frames 3 through 7, interleaved.
  for (let i = 0; i < frameCount; i++) {
    const srcFrame = frameOffset + i;
    const expectedL = srcFrame * 0.1;
    const expectedR = -(srcFrame * 0.1);

    assert_approx_equals(dest[i * channels], expectedL, 1e-6,
        `frame ${srcFrame} left channel`);
    assert_approx_equals(dest[i * channels + 1], expectedR, 1e-6,
        `frame ${srcFrame} right channel`);
  }
}, 'copyTo interleaved-to-interleaved with non-zero frameOffset');

test(t => {
  // Same test with s16 to ensure it's not float-specific.
  const channels = 2;
  const frames = 10;
  const data = new Int16Array(channels * frames);
  for (let i = 0; i < frames; i++) {
    data[i * channels] = i * 1000;
    data[i * channels + 1] = -(i * 1000);
  }

  const audioData = new AudioData({
    timestamp: 0,
    data: data,
    numberOfFrames: frames,
    numberOfChannels: channels,
    sampleRate: 44100,
    format: 's16',
  });
  t.add_cleanup(() => audioData.close());

  const frameOffset = 4;
  const frameCount = 3;
  const dest = new Int16Array(channels * frameCount);
  audioData.copyTo(dest, {
    planeIndex: 0,
    format: 's16',
    frameOffset: frameOffset,
    frameCount: frameCount,
  });

  for (let i = 0; i < frameCount; i++) {
    const srcFrame = frameOffset + i;
    assert_equals(dest[i * channels], srcFrame * 1000,
        `frame ${srcFrame} left channel`);
    assert_equals(dest[i * channels + 1], -(srcFrame * 1000),
        `frame ${srcFrame} right channel`);
  }
}, 'copyTo interleaved-to-interleaved s16 with non-zero frameOffset');

test(t => {
  // 3 channels, interleaved, to cover more than the stereo case.
  const channels = 3;
  const frames = 8;
  const data = new Float32Array(channels * frames);
  for (let i = 0; i < frames; i++) {
    for (let ch = 0; ch < channels; ch++) {
      data[i * channels + ch] = i + ch * 0.01;
    }
  }

  const audioData = new AudioData({
    timestamp: 0,
    data: data,
    numberOfFrames: frames,
    numberOfChannels: channels,
    sampleRate: 44100,
    format: 'f32',
  });
  t.add_cleanup(() => audioData.close());

  const frameOffset = 2;
  const frameCount = 4;
  const dest = new Float32Array(channels * frameCount);
  audioData.copyTo(dest, {
    planeIndex: 0,
    format: 'f32',
    frameOffset: frameOffset,
    frameCount: frameCount,
  });

  for (let i = 0; i < frameCount; i++) {
    const srcFrame = frameOffset + i;
    for (let ch = 0; ch < channels; ch++) {
      const expected = srcFrame + ch * 0.01;
      assert_approx_equals(
          dest[i * channels + ch], expected, 1e-6,
          `frame ${srcFrame} channel ${ch}`);
    }
  }
}, 'copyTo interleaved-to-interleaved f32 with 3 channels and frameOffset');
