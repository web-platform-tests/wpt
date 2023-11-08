// META: global=window,dedicatedworker

promise_test(async t => {
  const config = {
    codec: 'av01.0.04M.08',
    av1: { forceScreenContentTools: true},
    width: 1280,
    height: 720,
    bitrate: 5000000,
    framerate: 5,
  };

  let support = await VideoEncoder.isConfigSupported(config);
  assert_equals(support.supported, true);

  let new_config = support.config;
  assert_equals(new_config.codec, config.codec);
  assert_not_equals(new_config.av1, undefined);
  assert_equals(new_config.av1.forceScreenContentTools, config.av1.forceScreenContentTools);
}, 'Test that av1 forceScreenContentTools is recognized by VideoEncoder');
