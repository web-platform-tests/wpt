// META: title=Language Model Prompt Context Overflow
// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=../../../resources/util.js
// META: timeout=long

'use strict';

// Prompts `session` with enough input to exceed its context window, which
// evicts older input and fires the `contextoverflow` event.
async function overflowContext(session) {
  // Make sure there is something to evict.
  const kLongPrompt = kTestPrompt.repeat(10);
  const usage = await session.measureContextUsage(kLongPrompt);
  assert_greater_than(session.contextWindow, usage);
  await session.append(kLongPrompt);
  assert_greater_than(session.contextUsage, 0);
  // Generate a repeated kLongPrompt string that exceeds contextWindow.
  const repeatCount = session.contextWindow / session.contextUsage;
  const promptString = kLongPrompt.repeat(repeatCount);
  // The prompt promise succeeds, while causing older input to be evicted.
  await session.prompt(promptString);
}

promise_test(async () => {
  await ensureLanguageModel();
  const session = await createLanguageModel();
  const promise = new Promise(resolve => {
    session.addEventListener('contextoverflow', resolve);
  });
  await Promise.all([promise, overflowContext(session)]);
}, 'The `contextoverflow` event is fired when overall usage exceeds the context window');

promise_test(async () => {
  await ensureLanguageModel();
  const session = await createLanguageModel();
  assert_equals(session.oncontextoverflow, null);
  const promise = new Promise(resolve => {
    session.oncontextoverflow = resolve;
  });
  const [event] = await Promise.all([promise, overflowContext(session)]);
  assert_equals(event.type, 'contextoverflow');
  assert_equals(event.target, session);
}, 'The `oncontextoverflow` event handler is called when overall usage exceeds the context window');

promise_test(async () => {
  await ensureLanguageModel();
  const session = await createLanguageModel();
  const handler = () => {};
  session.oncontextoverflow = handler;
  assert_equals(session.oncontextoverflow, handler);
  session.oncontextoverflow = null;
  assert_equals(session.oncontextoverflow, null);
}, 'The `oncontextoverflow` event handler attribute can be set and cleared');
