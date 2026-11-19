// META: script=/common/get-host-info.sub.js

const hostInfo = get_host_info();
const httpScriptUrl = `${
    hostInfo
        .HTTP_ORIGIN}/common/empty.js?pipe=header(Access-Control-Allow-Origin,*)`;
const httpsScriptUrl = `${hostInfo.HTTPS_ORIGIN}/common/empty.js`;
const httpTextUrl = `${
    hostInfo
        .HTTP_ORIGIN}/common/text-plain.txt?pipe=header(Access-Control-Allow-Origin,*)`;
const httpsTextUrl = `${hostInfo.HTTPS_ORIGIN}/common/text-plain.txt`;
const httpsToHttpRedirectUrl =
    `${hostInfo.HTTPS_ORIGIN}/common/redirect.py?location=${
        encodeURIComponent(httpTextUrl)}`;
const wsUrl = `ws://${hostInfo.ORIGINAL_HOST}:${hostInfo.HTTP_PORT}/echo`;

const workerSource = `
  onconnect = (e) => {
    const port = e.ports[0];
    port.onmessage = async (msg) => {
      const {op, url} = msg.data;
      if (op === "importScripts") {
        try {
          importScripts(url);
          port.postMessage("loaded");
        } catch (err) {
          port.postMessage("blocked:" + err.name);
        }
      } else if (op === "dynamicImport") {
        try {
          await import(url);
          port.postMessage("loaded");
        } catch (err) {
          port.postMessage("blocked:" + err.name);
        }
      } else if (op === "fetch") {
        try {
          const response = await fetch(url);
          port.postMessage(response.ok ? "loaded" : "status:" + response.status);
        } catch (err) {
          port.postMessage("blocked:" + err.name);
        }
      } else if (op === "xhr") {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = () => port.postMessage("loaded");
        xhr.onerror = () => port.postMessage("blocked");
        xhr.send();
      } else if (op === "ws") {
        try {
          const ws = new WebSocket(url);
          ws.onopen = () => {
            ws.close();
            port.postMessage("connected");
          };
          ws.onerror = () => port.postMessage("blocked:error");
        } catch (err) {
          port.postMessage("blocked:" + err.name);
        }
      }
    };
  };
`;

function createTestSharedWorker(t) {
  assert_implements(window.SharedWorker, 'SharedWorker is not supported');
  const blob = new Blob([workerSource], {type: 'text/javascript'});
  const blobUrl = URL.createObjectURL(blob);
  t.add_cleanup(() => URL.revokeObjectURL(blobUrl));
  return new SharedWorker(blobUrl);
}

function runWorkerOp(worker, op, url) {
  return new Promise((resolve) => {
    worker.port.onmessage = (e) => resolve(e.data);
    worker.port.postMessage({op, url});
  });
}

promise_test(async (t) => {
  const worker = createTestSharedWorker(t);
  assert_equals(await runWorkerOp(worker, 'importScripts', httpScriptUrl),
                'blocked:NetworkError');
  assert_equals(await runWorkerOp(worker, 'importScripts', httpsScriptUrl),
                'loaded');
}, 'SharedWorker in HTTPS context blocks mixed-content importScripts while allowing HTTPS');

promise_test(async (t) => {
  const worker = createTestSharedWorker(t);
  assert_equals(await runWorkerOp(worker, 'dynamicImport', httpScriptUrl),
                'blocked:TypeError');
  assert_equals(await runWorkerOp(worker, 'dynamicImport', httpsScriptUrl),
                'loaded');
}, 'SharedWorker in HTTPS context blocks mixed-content dynamic import() while allowing HTTPS');

promise_test(async (t) => {
  const worker = createTestSharedWorker(t);
  assert_equals(await runWorkerOp(worker, 'fetch', httpTextUrl),
                'blocked:TypeError');
  assert_equals(await runWorkerOp(worker, 'fetch', httpsToHttpRedirectUrl),
                'blocked:TypeError');
  assert_equals(await runWorkerOp(worker, 'fetch', httpsTextUrl), 'loaded');
}, 'SharedWorker in HTTPS context blocks mixed-content fetch and HTTPS-to-HTTP redirects');

promise_test(async (t) => {
  const worker = createTestSharedWorker(t);
  assert_equals(await runWorkerOp(worker, 'xhr', httpTextUrl), 'blocked');
  assert_equals(await runWorkerOp(worker, 'xhr', httpsTextUrl), 'loaded');
}, 'SharedWorker in HTTPS context blocks mixed-content XMLHttpRequest');

promise_test(async (t) => {
  const worker = createTestSharedWorker(t);
  assert_equals(await runWorkerOp(worker, 'ws', wsUrl),
                'blocked:SecurityError');
}, 'SharedWorker in HTTPS context blocks insecure ws:// WebSocket');
