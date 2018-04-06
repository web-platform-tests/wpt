// META: script=../../../service-workers/service-worker/resources/test-helpers.sub.js
// META: script=/common/utils.js

const SCOPE = 'resources/basic.html';

async function cleanup() {
  for (const iframe of document.querySelectorAll('.test-iframe')) {
    iframe.parentNode.removeChild(iframe);
  }

  const reg = await navigator.serviceWorker.getRegistration(SCOPE);
  if (reg) await reg.unregister();
}

async function setupRegistration(t) {
  await cleanup();
  const reg = await navigator.serviceWorker.register('resources/range-sw.js', { scope: SCOPE });
  await wait_for_state(t, reg.installing, 'activated');
  return reg;
}

promise_test(async t => {
  const reg = await setupRegistration(t);
  const iframe = await with_iframe(SCOPE);
  const w = iframe.contentWindow;

  // Trigger a range request using media
  const url = new URL('long-wav.py?action=range-header-filter-test', w.location);
  url.hostname = 'www.web-platform.test';
  const audio = w.document.createElement('audio');
  audio.muted = true;
  audio.src = url;
  audio.preload = true;
  w.document.body.appendChild(audio);

  await fetch_tests_from_worker(reg.active);
}, `Defer range header filter tests to service worker`);

promise_test(async t => {
  const reg = await setupRegistration(t);
  const iframe = await with_iframe(SCOPE);
  const w = iframe.contentWindow;

  // Trigger a range request using media
  const url = new URL('long-wav.py?action=range-header-passthrough-test&range-received-key=' + token(), w.location);
  url.hostname = 'www.web-platform.test';
  const audio = w.document.createElement('audio');
  audio.muted = true;
  audio.src = url;
  audio.preload = true;
  w.document.body.appendChild(audio);

  await fetch_tests_from_worker(reg.active);
}, `Defer range header passthrough tests to service worker`);
