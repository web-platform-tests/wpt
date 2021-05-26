// Verifies that non-local HTTP(S) ports are open and serve correctly.
//
// See the corresponding WPT RFC:
// https://github.com/web-platform-tests/rfcs/blob/master/rfcs/address_space_overrides.md
//
// These ports are used to test the Private Network Access specification:
// https://wicg.github.io/private-network-access/
//
// More tests can be found in `fetch/private-network-access/`.

promise_test(() => {
  return fetch("https://{{host}}:{{ports[https-private][0]}}", {
    mode: "no-cors",
  });
}, "Fetch from https-private port works.");

promise_test(() => {
  return fetch("http://{{host}}:{{ports[http-private][0]}}", {
    mode: "no-cors",
  });
}, "Fetch from http-private port works.");

promise_test(() => {
  return fetch("https://{{host}}:{{ports[https-public][0]}}", {
    mode: "no-cors",
  });
}, "Fetch from https-public port works.");

promise_test(() => {
  return fetch("http://{{host}}:{{ports[http-public][0]}}", {
    mode: "no-cors",
  });
}, "Fetch from http-public port works.");
