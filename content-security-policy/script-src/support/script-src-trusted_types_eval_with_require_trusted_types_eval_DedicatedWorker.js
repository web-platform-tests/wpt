const testSetupPolicy = trustedTypes.createPolicy("p", { createScriptURL: s => s });
importScripts(testSetupPolicy.createScriptURL("/resources/testharness.js"));

trustedTypes.createPolicy('default', {createScript: s => s});

var evalScriptRan = false;
var setTimeoutScriptRan = false;
var setIntervalScriptRan = false;

promise_test(t => {
  const violation = new EventWatcher(t, self, 'securitypolicyviolation')
      .wait_for('securitypolicyviolation')
      .then(() => assert_unreached('Unexpected securitypolicyviolation'));
  eval("evalScriptRan = true;");
  return Promise.race([
    violation,
    new Promise(resolve => t.step_timeout(resolve, 0)),
  ]).then(() => assert_true(evalScriptRan));
}, "Script injected via direct `eval` is allowed with `trusted-types-eval` and `require-trusted-types-for 'script'` (Dedicated Worker).");

promise_test(t => {
  const violation = new EventWatcher(t, self, 'securitypolicyviolation')
      .wait_for('securitypolicyviolation')
      .then(() => assert_unreached('Unexpected securitypolicyviolation'));
  const id = setTimeout("setTimeoutScriptRan = true;", 0);
  t.add_cleanup(() => clearTimeout(id));
  return Promise.race([
    violation,
    new Promise(resolve => t.step_timeout(resolve, 0)),
  ]).then(() => assert_true(setTimeoutScriptRan));
}, "Script injected via `setTimeout` is allowed with `trusted-types-eval` and `require-trusted-types-for 'script'` (Dedicated Worker).");

promise_test(t => {
  const violation = new EventWatcher(t, self, 'securitypolicyviolation')
      .wait_for('securitypolicyviolation')
      .then(() => assert_unreached('Unexpected securitypolicyviolation'));
  const id = setInterval("setIntervalScriptRan = true;", 0);
  t.add_cleanup(() => clearInterval(id));
  return Promise.race([
    violation,
    new Promise(resolve => t.step_timeout(resolve, 0)),
  ]).then(() => assert_true(setIntervalScriptRan));
}, "Script injected via `setInterval` is allowed with `trusted-types-eval` and `require-trusted-types-for 'script'` (Dedicated Worker).");

done();
