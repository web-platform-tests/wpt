// Include after /common/reftest-wait.js. Report uncaught exceptions and
// unhandled rejections (e.g. from an unimplemented API) as a failure instead
// of waiting for a screenshot until the test times out.
window.addEventListener('error', failOnError);
window.addEventListener('unhandledrejection', failOnError);
