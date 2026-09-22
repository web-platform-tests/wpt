setup({ single_test: true });
var otherTimeout;
setTimeout(() => { clearTimeout(otherTimeout); done(); }, -100);
otherTimeout = setTimeout(assert_unreached, 10);
