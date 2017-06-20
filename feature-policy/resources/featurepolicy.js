function test_feature_availability(
    feature_decription, test, src, is_feature_enabled, allowed_feature_name,
    allow_attribute) {
  let frame = document.createElement('iframe');
  frame.src = src;

  if (typeof allowed_feature_name !== 'undefined') {
    frame.allow.add(allowed_feature_name);
  }

  if (typeof allow_attribute !== 'undefined') {
    frame.setAttribute(allow_attribute, true);
  }

  window.addEventListener('message', test.step_func(evt => {
    if (evt.source === frame.contentWindow) {
      if (is_feature_enabled) {
        assert_true(evt.data.enabled, feature_decription);
      } else {
        assert_false(evt.data.enabled, feature_decription);
      }
      document.body.removeChild(frame);
      test.done();
    }
  }));

  document.body.appendChild(frame);
}
