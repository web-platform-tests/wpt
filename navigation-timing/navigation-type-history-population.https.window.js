// META: title=PerformanceNavigationTiming.type when populating reloaded or traversed history entries
// META: script=/common/utils.js

'use strict';

async function ensureWindowCompletelyLoaded(t) {
  if (document.readyState !== 'complete') {
    await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
  }
  await new Promise(resolve => t.step_timeout(resolve, 0));
}

function withTimeout(t, promise, label, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      t.step_timeout(() => reject(new Error(`Timed out waiting for ${label}`)), ms);
    }),
  ]);
}

function waitForLoad(t, iframe, label, action) {
  return withTimeout(t, new Promise(resolve => {
    iframe.addEventListener('load', () => {
      t.step_timeout(resolve, 0);
    }, { once: true });
    action();
  }), label);
}

promise_test(async t => {
  await ensureWindowCompletelyLoaded(t);
  const channelName = token();
  const bc = new BroadcastChannel(channelName);
  const nextPopupReport = label => withTimeout(t, new Promise(resolve => {
    bc.addEventListener('message', e => resolve(e.data), { once: true });
  }), label);
  let popup = null;
  t.add_cleanup(() => {
    bc.close();
    if (popup && !popup.closed) popup.close();
  });
  const url1 = `/navigation-timing/resources/history-population-popup.html?channel=${channelName}&step=1&pipe=header(Cache-Control,no-store)`;
  const url2 = `/navigation-timing/resources/history-population-popup.html?channel=${channelName}&step=2&pipe=header(Cache-Control,no-store)`;
  let reportPromise = nextPopupReport('initial popup load');
  popup = window.open(url1, '_blank');
  let report = await reportPromise;
  assert_equals(report.step, '1');
  assert_equals(report.type, 'navigate');
  assert_false(report.persisted);
  reportPromise = nextPopupReport('popup reload');
  bc.postMessage({ action: 'reload' });
  report = await reportPromise;
  assert_equals(report.step, '1');
  assert_equals(report.type, 'reload');
  assert_false(report.persisted);
  reportPromise = nextPopupReport('popup navigate to step 2');
  bc.postMessage({ action: 'block-bfcache-and-navigate', nextUrl: url2 });
  report = await reportPromise;
  assert_equals(report.step, '2');
  assert_equals(report.type, 'navigate');
  reportPromise = nextPopupReport('popup back to step 1');
  bc.postMessage({ action: 'block-bfcache-and-back' });
  report = await reportPromise;
  assert_equals(report.step, '1');
  assert_false(report.persisted);
  assert_false(report.hadMarker);
  assert_equals(report.type, 'back_forward');
  reportPromise = nextPopupReport('popup forward to step 2');
  bc.postMessage({ action: 'block-bfcache-and-forward' });
  report = await reportPromise;
  assert_equals(report.step, '2');
  assert_false(report.persisted);
  assert_false(report.hadMarker);
  assert_equals(report.type, 'back_forward');
}, 'Top-level reload and non-BFCached back/forward history population set PerformanceNavigationTiming.type');

promise_test(async t => {
  await ensureWindowCompletelyLoaded(t);
  const iframe = document.createElement('iframe');
  t.add_cleanup(() => iframe.remove());
  iframe.srcdoc = '<!doctype html><p>srcdoc</p>';
  await waitForLoad(t, iframe, 'initial srcdoc load', () => document.body.appendChild(iframe));
  let entries = iframe.contentWindow.performance.getEntriesByType('navigation');
  assert_equals(entries.length, 1);
  assert_equals(entries[0].type, 'navigate');
  await waitForLoad(t, iframe, 'srcdoc reload', () => iframe.contentWindow.location.reload());
  entries = iframe.contentWindow.performance.getEntriesByType('navigation');
  assert_equals(entries.length, 1);
  assert_equals(entries[0].type, 'reload');
  await waitForLoad(t, iframe, 'blank load after srcdoc', () => {
    iframe.contentWindow.location.href = '/common/blank.html?after-srcdoc';
  });
  entries = iframe.contentWindow.performance.getEntriesByType('navigation');
  assert_equals(entries.length, 1);
  assert_equals(entries[0].type, 'navigate');
  await waitForLoad(t, iframe, 'back to srcdoc', () => iframe.contentWindow.history.back());
  assert_equals(iframe.contentWindow.location.href, 'about:srcdoc');
  entries = iframe.contentWindow.performance.getEntriesByType('navigation');
  assert_equals(entries.length, 1);
  assert_equals(entries[0].type, 'back_forward');
}, 'srcdoc iframe reload and back/forward history population set PerformanceNavigationTiming.type');

promise_test(async t => {
  await ensureWindowCompletelyLoaded(t);
  const blob = new Blob(['<!doctype html><p>blob</p>'], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  t.add_cleanup(() => URL.revokeObjectURL(blobUrl));
  const iframe = document.createElement('iframe');
  t.add_cleanup(() => iframe.remove());
  await waitForLoad(t, iframe, 'initial blob load', () => {
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
  });
  assert_equals(iframe.contentWindow.performance.getEntriesByType('navigation')[0].type, 'navigate');
  await waitForLoad(t, iframe, 'blob reload', () => iframe.contentWindow.location.reload());
  assert_equals(iframe.contentWindow.performance.getEntriesByType('navigation')[0].type, 'reload');
  await waitForLoad(t, iframe, 'blank load after blob', () => {
    iframe.contentWindow.location.href = '/common/blank.html?after-blob';
  });
  assert_equals(iframe.contentWindow.performance.getEntriesByType('navigation')[0].type, 'navigate');
  await waitForLoad(t, iframe, 'back to blob', () => iframe.contentWindow.history.back());
  assert_equals(iframe.contentWindow.performance.getEntriesByType('navigation')[0].type, 'back_forward');
}, 'blob: URL iframe reload and back/forward history population set PerformanceNavigationTiming.type');

promise_test(async t => {
  await ensureWindowCompletelyLoaded(t);
  const dataPayload = encodeURIComponent(
    '<!doctype html><script>' +
    'window.addEventListener("load", () => setTimeout(() => {' +
    '  const navType = performance.getEntriesByType("navigation")[0].type;' +
    '  if (window.name === "reload-once") {' +
    '    window.name = "reloaded"; location.reload();' +
    '  } else { parent.postMessage({ step: window.name, navType }, "*"); }' +
    '}, 0));' +
    '<\\/script>'
  );
  const dataUrl = `data:text/html,${dataPayload}`;
  const iframe = document.createElement('iframe');
  iframe.name = 'initial';
  t.add_cleanup(() => iframe.remove());
  const nextMessage = label => withTimeout(t, new Promise(resolve => {
    window.addEventListener('message', e => resolve(e.data), { once: true });
  }), label);
  let msgPromise = nextMessage('initial data load');
  iframe.src = dataUrl;
  document.body.appendChild(iframe);
  let msg = await msgPromise;
  assert_equals(msg.navType, 'navigate');
  await waitForLoad(t, iframe, 'blank before reload', () => {
    iframe.src = '/common/blank.html?before-reload';
  });
  iframe.contentWindow.name = 'reload-once';
  msgPromise = nextMessage('data reload');
  iframe.contentWindow.location.href = dataUrl;
  msg = await msgPromise;
  assert_equals(msg.step, 'reloaded');
  assert_equals(msg.navType, 'reload');
  await waitForLoad(t, iframe, 'blank after data', () => {
    iframe.src = '/common/blank.html?after-data';
  });
  iframe.contentWindow.name = 'traversed';
  msgPromise = nextMessage('back to data');
  iframe.contentWindow.history.back();
  msg = await msgPromise;
  assert_equals(msg.step, 'traversed');
  assert_equals(msg.navType, 'back_forward');
}, 'data: URL iframe reload and back/forward history population set PerformanceNavigationTiming.type');

promise_test(async t => {
  await ensureWindowCompletelyLoaded(t);
  const iframe = document.createElement('iframe');
  t.add_cleanup(() => iframe.remove());
  iframe.sandbox = 'allow-scripts allow-same-origin';
  await waitForLoad(t, iframe, 'initial sandboxed load', () => {
    iframe.src = '/common/blank.html?target-snapshot-1';
    document.body.appendChild(iframe);
  });
  await waitForLoad(t, iframe, 'sandboxed reload', () => iframe.contentWindow.location.reload());
  assert_equals(iframe.contentWindow.performance.getEntriesByType('navigation')[0].type, 'reload');
  assert_equals(iframe.contentWindow.open('/common/blank.html'), null);
  await waitForLoad(t, iframe, 'sandboxed second page', () => {
    iframe.contentWindow.location.href = '/common/blank.html?target-snapshot-2';
  });
  await waitForLoad(t, iframe, 'sandboxed back', () => iframe.contentWindow.history.back());
  assert_equals(iframe.contentWindow.performance.getEntriesByType('navigation')[0].type, 'back_forward');
  assert_equals(iframe.contentWindow.open('/common/blank.html'), null);
}, 'Target snapshot sandboxing flags are preserved alongside PerformanceNavigationTiming.type on reload and back/forward');
