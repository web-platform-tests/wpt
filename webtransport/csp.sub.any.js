// META: global=window,worker
// META: script=/common/get-host-info.sub.js

const HOST = get_host_info().ORIGINAL_HOST;
const PORT = '{{ports[webtransport-h3][0]}}';
const BASE = `https://${HOST}:${PORT}`;

function set_csp(destination) {
  var meta = document.createElement("meta");
  meta.httpEquiv = "Content-Security-Policy";
  meta.content = `connect-src ${destination}`;
  return meta;
}

promise_test(async t => {
  let meta = set_csp('none');
  document.head.appendChild(meta);

  let wt = new WebTransport(`${BASE}/handlers/custom-response.py?:status=200`);
  await promise_rejects_dom(t, 'SecurityError', wt.ready, 'ready should reject');
  await promise_rejects_dom(t, 'SecurityError', wt.closed, 'closed should reject');
}, "WebTransport connection should fail when CSP connect-src is set to none and reject the promises");

promise_test(async t => {
  let meta = set_csp(`${BASE}/webtransport/csp.sub.any.html`);
  document.head.appendChild(meta);

  let wt = new WebTransport(`${BASE}/handlers/custom-response.py?:status=200`);
  await wt.ready;
}, "WebTransport connection should succeed when CSP connect-src destination is set to the page");
