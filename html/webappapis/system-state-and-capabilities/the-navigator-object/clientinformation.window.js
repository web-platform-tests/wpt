test(() => {
  assert_equals(window.clientInformation, window.navigator);
}, "window.clientInformation exists and equals window.navigator");

test(() => {
  const originalClientInformation = window.clientInformation;
  window.clientInformation = 'hello';
  assert_equals(window.clientInformation, originalClientInformation);
}, 'window.clientInformation should not be replaceable.');
