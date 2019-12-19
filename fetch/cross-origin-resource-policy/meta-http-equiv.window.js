// META: script=/common/get-host-info.sub.js

const crossOriginURL = get_host_info().HTTP_REMOTE_ORIGIN + "/fetch/cross-origin-resource-policy/resources/meta-http-equiv.html";

// Note: An ignored (invalid) <meta http-equiv> results in a successful load.
promise_test(t => {
  return fetch(crossOriginURL, { mode: "no-cors" });
}, "<meta http-equiv=Cross-Origin-Resource-Policy content=same-origin> should not be supported");
