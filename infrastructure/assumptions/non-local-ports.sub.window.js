// Verifies that non-local HTTP(S) ports are open and serve correctly.
//
// See the corresponding WPT RFC:
// https://github.com/web-platform-tests/rfcs/blob/master/rfcs/address_space_overrides.md
//
// These ports are used to test the Private Network Access specification:
// https://wicg.github.io/private-network-access/
//
// More tests can be found in `fetch/private-network-access/`.

function newRelativeUrl(url, { protocol, port }) {
  result = new URL(url, window.location);
  if (port) {
    result.port = port;
  }
  if (protocol) {
    result.protocol = protocol;
  }
  return result;
}

promise_test(() => {
  const url = newRelativeUrl("resources/exists.txt", {
    protocol: "https:",
    port: "{{ports[https-private][0]}}"
  });
  return fetch(url, { mode: "no-cors" });
}, "Fetch from https-private port works.");

promise_test(() => {
  const url = newRelativeUrl("resources/exists.txt", {
    protocol: "http:",
    port: "{{ports[http-private][0]}}"
  });
  return fetch(url, { mode: "no-cors" });
}, "Fetch from http-private port works.");

promise_test(() => {
  const url = newRelativeUrl("resources/exists.txt", {
    protocol: "https:",
    port: "{{ports[https-public][0]}}"
  });
  return fetch(url, { mode: "no-cors" });
}, "Fetch from https-public port works.");

promise_test(() => {
  const url = newRelativeUrl("resources/exists.txt", {
    protocol: "http:",
    port: "{{ports[http-public][0]}}"
  });
  return fetch(url, { mode: "no-cors" });
}, "Fetch from http-public port works.");
