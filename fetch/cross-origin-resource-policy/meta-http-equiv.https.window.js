// META: script=/common/get-host-info.sub.js

const crossOriginURL = get_host_info().HTTPS_REMOTE_ORIGIN + "/fetch/cross-origin-resource-policy/resources/meta-http-equiv.html";

// Note: An ignored (invalid) <meta http-equiv> results in a successful load.
async_test(t => {
  const iframe = document.createElement('iframe');
  iframe.src = crossOriginURL;
  document.body.appendChild(iframe);
  window.onmessage = t.step_func_done(e => {
    assert_equals(e.data, 'hello http-equiv');
  });
}, "<meta http-equiv=Cross-Origin-Resource-Policy content=same-origin> should not be supported");
