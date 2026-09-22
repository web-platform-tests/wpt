setup({ single_test: true });
var otherTimeout;
setTimeout(() => { clearTimeout(otherTimeout); done(); }, Math.pow(2, 32));
otherTimeout = setTimeout(assert_unreached, 100);
