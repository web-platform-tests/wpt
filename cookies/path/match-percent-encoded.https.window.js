// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: title=Cookie Path attribute matching against percent-encoded URL paths

'use strict';

// A cookie's path is compared against the request URL's path, whose segments are
// percent-encoded. So a byte written literally in a Path attribute does not match
// its percent-encoded form in a URL, and a non-ASCII byte, which makes the cookie
// fail to parse, is not reachable at any encoding of it.
//
// Observing this needs paths with no file behind them, so a service worker
// synthesizes a document at whichever path is probed. The document reads
// document.cookie, because a service worker cannot see a request's Cookie header.
//
// https://github.com/whatwg/url/issues/814

const SCOPE = '/cookies/path/resources/probe/';

// Sets a Set-Cookie header, replacing "ZZ" in `cookie` with the raw bytes given
// as percent-escapes. wptserve percent-decodes the query into bytes and cookie.py
// passes those bytes to the header unchanged, which is how a byte that a URL path
// would percent-encode reaches the Path attribute as itself.
async function setCookieViaHTTP(cookie, rawEscape) {
  let query = encodeURIComponent(JSON.stringify([cookie]));
  if (rawEscape !== undefined) {
    query = query.replace('ZZ', rawEscape);
  }
  const response = await fetch(`/cookies/resources/cookie.py?set=${query}`);
  assert_true(response.ok, 'Setting the cookie via HTTP succeeded');
}

// Loads a synthesized document at `path` and returns what it reported.
function probeAtPath(path) {
  return new Promise(resolve => {
    const iframe = document.createElement('iframe');
    iframe.style = 'display: none';
    const onMessage = event => {
      if (event.source !== iframe.contentWindow) {
        return;
      }
      window.removeEventListener('message', onMessage);
      iframe.remove();
      resolve(event.data);
    };
    window.addEventListener('message', onMessage);
    iframe.src = path;
    document.body.appendChild(iframe);
  });
}

let registration;

promise_setup(async () => {
  registration = await navigator.serviceWorker.register(
      'resources/probe/sw.js', {scope: SCOPE});
  // navigator.serviceWorker.ready is not usable here: it waits for a worker
  // controlling this document, and this document is outside the scope the probe
  // paths need. Wait on the registration's own worker instead.
  const worker =
      registration.installing || registration.waiting || registration.active;
  if (worker.state !== 'activated') {
    await new Promise(resolve => {
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') {
          resolve();
        }
      });
    });
  }
});

function cookieTest(name, body) {
  promise_test(async t => {
    await test_driver.delete_all_cookies();
    t.add_cleanup(test_driver.delete_all_cookies);
    await body(t);
  }, name);
}

// Controls: the service worker synthesizes a document at the probed path and
// cookies for that path are visible in it, so the apparatus reports what it
// claims to.
cookieTest('CONTROL a cookie for the probed path is visible in it', async t => {
  await setCookieViaHTTP(`control=1; Path=${SCOPE}zzx`);
  const result = await probeAtPath(`${SCOPE}zzx/probe.html`);
  assert_equals(result.path, `${SCOPE}zzx/probe.html`,
                'The document was synthesized at the probed path');
  assert_equals(result.cookie, 'control=1');
});

cookieTest('CONTROL a cookie for a prefix of the probed path is visible in it',
           async t => {
  await setCookieViaHTTP(`prefix=1; Path=${SCOPE}`);
  const result = await probeAtPath(`${SCOPE}zzx/probe.html`);
  assert_equals(result.cookie, 'prefix=1');
});

// Each case sets one cookie whose Path ends in `pathSegment`, with "ZZ" replaced
// by the raw bytes `raw` when given, then probes the URL path segment
// `probeSegment`.
const CASES = [
  // A byte that is ASCII but that a URL path percent-encodes. The cookie is
  // stored, but its path does not match the encoded segment.
  {
    name: 'a literal space does not match a percent-encoded space',
    pathSegment: 'zzZZa',
    raw: '%20',
    probeSegment: 'zz%20a',
    sent: false,
  },
  {
    name: 'a percent-encoded space matches a percent-encoded space',
    pathSegment: 'zz%20a',
    probeSegment: 'zz%20a',
    sent: true,
  },

  // A non-ASCII byte cannot be a URL path segment, so the cookie fails to parse
  // and is reachable nowhere: neither at the percent-encoding of the byte, nor at
  // the percent-encoding of its isomorphic decoding.
  {
    name: 'a non-ASCII byte is not reachable at the percent-encoding of that byte',
    pathSegment: 'zzZZ',
    raw: '%B8',
    probeSegment: 'zz%B8',
    sent: false,
  },
  {
    name: 'a non-ASCII byte is not reachable at the percent-encoding of its isomorphic decoding',
    pathSegment: 'zzZZ',
    raw: '%B8',
    probeSegment: 'zz%C2%B8',
    sent: false,
  },
  {
    name: 'a multi-byte non-ASCII sequence is not reachable at the percent-encoding of those bytes',
    pathSegment: 'zzZZ',
    raw: '%E4%B8%AD',
    probeSegment: 'zz%E4%B8%AD',
    sent: false,
  },
  {
    name: 'a multi-byte non-ASCII sequence is not reachable at the percent-encoding of its isomorphic decoding',
    pathSegment: 'zzZZ',
    raw: '%E4%B8%AD',
    probeSegment: 'zz%C3%A4%C2%B8%C2%AD',
    sent: false,
  },
  {
    name: 'an already percent-encoded non-ASCII byte matches, being ASCII itself',
    pathSegment: 'zz%C2%B8',
    probeSegment: 'zz%C2%B8',
    sent: true,
  },
];

for (const testCase of CASES) {
  cookieTest(`A Path attribute where ${testCase.name}`, async t => {
    await setCookieViaHTTP(
        `t=1; Path=${SCOPE}${testCase.pathSegment}`, testCase.raw);
    const result = await probeAtPath(`${SCOPE}${testCase.probeSegment}/probe.html`);
    assert_equals(result.cookie, testCase.sent ? 't=1' : '');
  });
}

promise_test(async t => {
  await registration.unregister();
}, 'cleanup: unregister the service worker');
