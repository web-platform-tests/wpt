// A url source is a source expression which allows a script by the URL string
// it's requested with. The tests run in a variant for each syntax of url
// sources, given in the source parameter of the test's URL:
// - "hash": url hashes, e.g. 'url-sha256-...'.
const URL_SOURCE_SYNTAX = new URLSearchParams(location.search).get("source");

function base64urlEncode(data) {
  let result = btoa(data);
  return result.replace(/\+/g, "-").replace(/\//g, "_");
}

const sha256ofURLBytes = async (url) => {
  const buffer = new TextEncoder().encode(url.toString());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => String.fromCharCode(b)).join('');
};

const sha256ofURL = async (url) => {
  return base64urlEncode(await sha256ofURLBytes(url));
};

// Returns the url source which allows |url_string|, in the syntax of the
// test's variant.
async function url_source(url_string) {
  switch (URL_SOURCE_SYNTAX) {
    case "hash":
      return `'url-sha256-${await sha256ofURL(url_string)}'`;
  }
  throw new Error(`Unknown url source syntax: ${URL_SOURCE_SYNTAX}`);
}

// Checks that |violation|, i.e. a SecurityPolicyViolationEvent or the data
// copied from it, has the members which tell the author how to allow the
// script requested with |url| by a url source, in the syntax of the test's
// variant.
async function assert_url_source_report(violation, url) {
  switch (URL_SOURCE_SYNTAX) {
    case "hash":
      // The urlHash member is in standard base64 with padding.
      assert_equals(violation.urlHash,
                    `url-sha256-${btoa(await sha256ofURLBytes(url))}`);
      return;
  }
  throw new Error(`Unknown url source syntax: ${URL_SOURCE_SYNTAX}`);
}

// Returns the URL of the support document |file|, with |policy| delivered
// either in the response header (|test_type| "header", loading |file|.sub.html)
// or in a meta tag (|test_type| "metatag", loading |file|_meta.sub.html), and
// the additional query parameters |params|.
function get_support_url(test_type, file, policy, params = {}) {
  const query = new URLSearchParams(params);
  if (test_type == "header") {
    query.set("pipe", `header(Content-Security-Policy,${policy})`);
    return `support/${file}.sub.html?${query}`;
  }
  query.set("policy", policy);
  return `support/${file}_meta.sub.html?${query}`;
}

// Loads |src| in an iframe and resolves with the first message the iframe
// posts, e.g. "SCRIPT_RAN" or "CSP_VIOLATION".
function load_frame(t, src) {
  const frame = document.createElement('iframe');
  frame.src = src;
  t.add_cleanup(() => frame.remove());
  const result = new Promise(resolve => {
    window.onmessage = e => {
      if (e.source === frame.contentWindow) {
        resolve(e.data);
      }
    };
  });
  document.body.appendChild(frame);
  return result;
}

// Tests whether a script requested with |url_string|, e.g. the value of the
// src attribute, is allowed by a policy with the url source of |allowed|, a
// URL string or a list of them, and |sources| in |directive|. The policy is
// delivered as given by |test_type|, see get_support_url(). Loads |url_string|
// in the support document |frame| and checks that it posts |expected|.
function url_string_test({name, url_string, allowed, expected,
                          test_type = "header", directive = "script-src",
                          sources = "", frame = "iframe"}) {
  promise_test(async t => {
    const all_sources = ["'nonce-forinlinescript'"];
    for (const allowed_url_string of [allowed].flat()) {
      all_sources.push(await url_source(allowed_url_string));
    }
    if (sources) {
      all_sources.push(sources);
    }
    const policy = `${directive} ${all_sources.join(" ")}`;

    const result = await load_frame(t, get_support_url(test_type, frame,
        policy, {script_url: url_string}));
    assert_equals(result, expected);
  }, `${name} - ${test_type}`);
}
