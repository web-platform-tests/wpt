// META: title=Violation reports of scripts blocked by policies with url sources
// META: variant=?source=hash
// META: timeout=long
// META: script=/service-workers/service-worker/resources/test-helpers.sub.js
// META: script=support/util.js

const scriptUrl = new URL("support/externalScript.js", location.href).href;

// A policy with a url source, which doesn't allow externalScript.js.
async function get_policy() {
  return `script-src 'nonce-forinlinescript' ${await url_source("other.js")}`;
}

// The URL of the worker script which reports the violation of importing
// externalScript.js.
async function get_worker_url() {
  return `support/worker-report.js?${new URLSearchParams({
    pipe: `header(Content-Security-Policy,${await get_policy()})`,
  })}`;
}

async function assert_violation(violation) {
  assert_equals(violation.blockedURI, scriptUrl);
  await assert_url_source_report(violation, scriptUrl);
}

promise_test(async t => {
  await assert_violation(await load_frame(t,
      `support/report.html?${new URLSearchParams({
        script_url: scriptUrl,
        pipe: `header(Content-Security-Policy,${await get_policy()})`,
      })}`));
}, "violation report should contain the url source of a script blocked in a document");

promise_test(async t => {
  const worker = new Worker(await get_worker_url());
  t.add_cleanup(() => worker.terminate());
  await assert_violation(await new Promise(resolve => {
    worker.onmessage = e => resolve(e.data);
  }));
}, "violation report should contain the url source of a script blocked in a dedicated worker");

promise_test(async t => {
  const worker = new SharedWorker(await get_worker_url());
  await assert_violation(await new Promise(resolve => {
    worker.port.onmessage = e => resolve(e.data);
  }));
}, "violation report should contain the url source of a script blocked in a shared worker");

promise_test(async t => {
  const SCOPE = 'support/does-not-exist.html';

  // Make sure we have a clean state.
  await service_worker_unregister(t, SCOPE);
  t.add_cleanup(() => service_worker_unregister(t, SCOPE));

  const violation = new Promise(resolve => {
    navigator.serviceWorker.addEventListener('message', e => resolve(e.data));
  });
  navigator.serviceWorker.register(await get_worker_url(), {scope: SCOPE})
      .catch(() => {
        // The result is checked through the violation message.
      });
  await assert_violation(await violation);
}, "violation report should contain the url source of a script blocked in a service worker");
