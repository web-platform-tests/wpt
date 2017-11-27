'use strict';

// Run a test function as two test cases.
// The first test case test the configuration by passing a given config
// to the constructor.
// The second test case create an RTCPeerConnection object with default
// configuration, then call setConfiguration with the provided config.
// The test function is given a constructor function to create
// a new instance of RTCPeerConnection with given config,
// either directly as constructor parameter or through setConfiguration.
function config_test(test_func, desc) {
  test(t => {
    test_func(config => {
      const pc = new RTCPeerConnection(config)
      t.add_cleanup(() => pc.close());
      return pc;
    });
  }, `new RTCPeerConnection(config) - ${desc}`);

  test(t => {
    test_func(config => {
      const pc = new RTCPeerConnection();
      t.add_cleanup(() => pc.close());
      assert_idl_attribute(pc, 'setConfiguration');
      pc.setConfiguration(config);
      return pc;
    })
  }, `setConfiguration(config) - ${desc}`);
}
