const globalThisStr = getGlobalThisStr();

// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timer-initialisation-steps,
// step 9.6.1.1.
const expectedSink = globalThisStr.includes("Window") ? "Window" : "WorkerGlobalScope";

// setTimeout tests
// TrustedScript assignments do not throw.
async_test(t => {
  globalThis.timeoutTest = t;
  let policy = createScript_policy(globalThis, 'timeout');
  let script = policy.createScript("globalThis.timeoutTest.done();");
  setTimeout(script);
}, `${globalThisStr}.setTimeout assigned via policy (successful Script transformation).`);

// String assignments throw.
test(t => {
  globalThis.timeoutTestString = t.unreached_func();
  assert_throws_js(TypeError, _ => {
    setTimeout("globalThis.timeoutTestString();");
  });
}, `\`${globalThisStr}.setTimeout(string)\` throws.`);

// Null assignment throws.
test(t => {
  assert_throws_js(TypeError, _ => {
    globalThis.setTimeout(null);
  });
}, `\`${globalThisStr}.setTimeout(null)\` throws.`);

// setInterval tests
// TrustedScript assignments do not throw.
async_test(t => {
  globalThis.intervalTest = t;
  let policy = createScript_policy(globalThis, 'script');
  let script = policy.createScript("globalThis.intervalTest.done();");
  globalThis.setInterval(script);
}, `${globalThisStr}.setInterval assigned via policy (successful Script transformation).`);

// String assignments throw.
test(t => {
  globalThis.intervalTestString = t.unreached_func();
  assert_throws_js(TypeError, _ => {
    globalThis.setInterval("globalThis.intervalTestString()");
  });
}, `\`${globalThisStr}.setInterval(string)\` throws.`);

// Null assignment throws.
test(t => {
  assert_throws_js(TypeError, _ => {
    globalThis.setInterval(null);
  });
}, `\`${globalThisStr}.setInterval(null)\` throws.`);

promise_test(async t => {
  const input = ";".repeat(100);
  let violation = await trusted_type_violation_for(TypeError, _ =>
    globalThis.setTimeout(input)
  );
  assert_equals(violation.blockedURI, "trusted-types-sink");
  assert_equals(violation.sample, `${expectedSink} setTimeout|${clipSampleIfNeeded(input)}`);
}, `Violation report for ${globalThisStr}.setTimeout`);

const kTimeoutTestString = "timeoutTestString";
const kIntervalTestString = "intervalTestString";

// After default policy creation string assignment implicitly calls createScript.
promise_test(async t => {
let policy = globalThis.trustedTypes.createPolicy("default", { createScript: (x, _, sink) => {
  if (x === kTimeoutTestString) {
    assert_equals(sink, `${expectedSink} setTimeout`);
  } else if (x === kIntervalTestString) {
    assert_equals(sink, `${expectedSink} setInterval`);
  }
  return "0";
}});
  globalThis.setTimeout(INPUTS.SCRIPT);
  globalThis.setInterval(INPUTS.SCRIPT);
}, `\`${globalThisStr}.setTimeout(string)\`, \`${globalThisStr}.setInterval(string)\` via default policy (successful Script transformation).`);
// After default policy creation null assignment implicitly calls createScript.
promise_test(async t => {
  globalThis.setTimeout(null);
  globalThis.setInterval(null);
}, `\`${globalThisStr}.setTimeout(null)\`, \`${globalThisStr}.setInterval(null)\` via default policy (successful Script transformation).`);

promise_test(async t => {
  globalThis.setTimeout(kTimeoutTestString);
  globalThis.setInterval(kIntervalTestString);
}, `${globalThisStr}.setTimeout and ${globalThisStr}.setInterval pass the correct sink to the default policy`
)
