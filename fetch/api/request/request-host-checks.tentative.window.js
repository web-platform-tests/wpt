// META: pac=/common/proxy-all.sub.pac
// META: timeout=long

// Which hosts, once accepted by the URL parser, does a browser actually
// request? See https://github.com/whatwg/url/issues/397.
//
// Fetch does not define this yet, so for now these tests measure rather than
// assert: PASS means the browser sent the request and FAIL means it rejected
// the host before sending it.
//
// By default every request goes to wptserve through the PAC file above, so any
// host works without DNS. Browsers check hosts they send to a proxy as well
// (Chrome in URLRequestHttpJob, Firefox in nsSocketTransport).
//
// To run without a proxy (e.g., in Safari, which does not support PAC files
// in wptrunner), load this test with ?suffix=<domain>&port=<port>, where every
// subdomain of <domain> resolves to the machine running wptserve, e.g., using
// `./wpt serve --dns --dns-wildcards 1`. Hosts that need their own last label
// are then skipped.

const params = new URLSearchParams(location.search);
const suffix = params.get("suffix");
const useProxy = suffix === null;
const tld = suffix ?? "wpt";
const port = params.get("port");

function urlFor(host) {
  return `http://${host}${port ? `:${port}` : ""}/fetch/api/resources/close-connection.py`;
}

// A lookup that never gets an answer fails with a TimeoutError rather than
// stalling the remaining tests.
function request(url) {
  return fetch(url, { mode: "no-cors", cache: "no-store", signal: AbortSignal.timeout(5000) });
}

// Returns a host of exactly `length` code points, ending in `tld`.
function longHost(length) {
  let host = tld;
  while (host.length < length) {
    const room = length - host.length - 1;
    let size = Math.min(63, room);
    if (room - size === 1) {
      size--;
    }
    host = `${"a".repeat(size)}.${host}`;
  }
  return host;
}

const cases = [
  { name: "letters", host: `a.${tld}` },
  { name: "hyphen", host: `a-b.${tld}` },
  { name: "IDNA", host: `élève.${tld}` },
  { name: "single label", host: "a", proxyOnly: true },
  { name: "single label *", host: "*", proxyOnly: true },

  ...[..."!\"$&'()*+,;=_`{}~"].map(c => {
    const codePoint = c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
    return { name: `U+${codePoint} (${c})`, host: `a${c}b.${tld}` };
  }),

  { name: "leading hyphen", host: `-a.${tld}` },
  { name: "trailing hyphen", host: `a-.${tld}` },
  { name: "hyphen-only label", host: `-.${tld}` },
  { name: "hyphens in the third and fourth positions", host: `ab--c.${tld}` },
  { name: "leading underscore", host: `_a.${tld}` },
  { name: "trailing underscore", host: `a_.${tld}` },
  { name: "underscore-only label", host: `_.${tld}` },

  { name: "last label with leading hyphen", host: "a.-b", proxyOnly: true },
  { name: "last label with trailing hyphen", host: "a.b-", proxyOnly: true },
  { name: "last label with leading underscore", host: "a._b", proxyOnly: true },
  { name: "last label with trailing underscore", host: "a.b_", proxyOnly: true },

  { name: "empty label", host: `a..${tld}` },
  { name: "leading empty label", host: `.a.${tld}` },
  { name: "trailing dot", host: `a.${tld}.` },
  { name: "two trailing dots", host: `a.${tld}..` },

  { name: "63-code-point label", host: `${"a".repeat(63)}.${tld}` },
  { name: "64-code-point label", host: `${"a".repeat(64)}.${tld}` },
  { name: "253 code points", host: longHost(253) },
  { name: "254 code points", host: longHost(254) },
  { name: "254 code points, including a trailing dot", host: `${longHost(253)}.` },
  { name: "255 code points, including a trailing dot", host: `${longHost(254)}.` },
];

// Firefox pools connections to an HTTP proxy per proxy rather than per
// destination host, and only checks the destination host when it opens a new
// connection. Requesting a host that both Chrome and Firefox reject until that
// fails ensures there is no idle connection left to reuse. Every response from
// close-connection.py closes its connection, so none are added back.
const SENTINEL_HOST = "a!b.wpt";

async function drainIdleConnections() {
  for (let i = 0; i < 50; i++) {
    try {
      await request(urlFor(SENTINEL_HOST));
    } catch {
      return true;
    }
  }
  return false;
}

let canDrain = false;

if (useProxy) {
  promise_test(async () => {
    canDrain = await drainIdleConnections();
    assert_true(canDrain, `${SENTINEL_HOST} was never rejected; other results might reflect connection reuse`);
  }, `Setup: ${SENTINEL_HOST} is rejected`);
}

for (const { name, host, proxyOnly } of cases) {
  if (proxyOnly && !useProxy) {
    continue;
  }

  let url = null;
  try {
    url = new URL(urlFor(host));
  } catch {}

  let testName = `${name}: URL parser failure`;
  if (url) {
    testName = url.hostname.length > 40 ? name : `${name}: ${url.hostname}`;
  }

  promise_test(async () => {
    assert_not_equals(url, null, "URL parser failure");
    if (canDrain) {
      assert_true(await drainIdleConnections(), "could not drain idle connections");
    }
    await request(url);
  }, testName);
}
