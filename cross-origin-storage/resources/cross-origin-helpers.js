// Cross-origin test infrastructure shared by COS's origin-scoping and
// cross-origin declarative/import-attribute integration tests. Requires
// /common/dispatcher/dispatcher.js and /common/utils.js to already be
// loaded.

// Creates a hidden iframe pointed at the remote executor page on `origin`,
// with `cross-origin-storage` explicitly allowed via the iframe's `allow`
// attribute (shorthand for "cross-origin-storage 'src'"), and returns a
// RemoteContext for running script inside it. `pipeHeader`, if given, is a
// wptserve pipe `header(...)` (or `|`-joined multiple headers) directive
// applied to the executor response itself, e.g. to test an explicit
// Permissions-Policy header instead of relying on the default allowlist.
async function cosOpenRemoteContext(origin, {allow = 'cross-origin-storage', pipeHeader} = {}) {
  const uuid = token();
  let url = `${origin}/common/dispatcher/remote-executor.html`;
  const params = new URLSearchParams({uuid});
  if (pipeHeader) {
    // pipe must be the raw (unencoded by URLSearchParams a second time)
    // wptserve directive; URLSearchParams already percent-encodes it once,
    // which matches what the SRI/Integrity-Policy tests do via
    // encodeURIComponent.
    params.set('pipe', pipeHeader);
  }
  url += `?${params.toString()}`;

  const iframe = document.createElement('iframe');
  if (allow) {
    iframe.allow = allow;
  }
  iframe.src = url;
  document.body.appendChild(iframe);

  const ctx = new RemoteContext(uuid);
  // Ping until the executor is ready to receive commands.
  await ctx.execute_script(() => true);
  return {ctx, iframe};
}

// Runs `navigator.crossOriginStorage.requestFileHandle(hash)` inside a
// RemoteContext and returns a plain, serializable descriptor instead of
// letting a DOMException cross the postMessage-like boundary (where only
// TypeError survives with its name intact; everything else becomes a
// generic Error). Shaped as either {ok: true, text} or
// {ok: false, name, message}.
async function cosRemoteRead(ctx, hash) {
  return ctx.execute_script(async (hash) => {
    try {
      const handle = await navigator.crossOriginStorage.requestFileHandle(hash);
      const file = await handle.getFile();
      return {ok: true, text: await file.text()};
    } catch (e) {
      return {ok: false, name: e.name, message: e.message};
    }
  }, [hash]);
}

// As cosRemoteRead(), but returns the SHA-256 of the retrieved bytes rather
// than their text. Needed whenever the stored resource is binary: reading it
// back as text is lossy, so comparing text would fail even on a byte-perfect
// disclosure. Shaped as {ok: true, digest} or {ok: false, name, message}.
async function cosRemoteReadDigest(ctx, hash) {
  return ctx.execute_script(async (hash) => {
    try {
      const handle = await navigator.crossOriginStorage.requestFileHandle(hash);
      const file = await handle.getFile();
      const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
      return {
        ok: true,
        digest: Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, '0')).join(''),
      };
    } catch (e) {
      return {ok: false, name: e.name, message: e.message};
    }
  }, [hash]);
}

// The cross-origin probe budget
// (https://wicg.github.io/cross-origin-storage/#cross-site-identifiers) is
// per-origin, persists across page loads, and replenishes only on user
// activation -- which an iframe the user never interacts with does not get.
// Every cross-origin read in this suite is therefore charged against a budget
// the test can neither observe nor restore, and pointing every test at the
// same two remote origins would accumulate roughly thirty distinct hashes
// against them over a full run. Past the budget those reads are refused with
// NotFoundError, which cosAssertDisclosableOrGreased() tolerates -- so the
// tests would silently stop testing anything rather than fail.
//
// These pools spread that load over every distinct origin wptserve offers, of
// each site relationship the tests actually depend on. They do not eliminate
// the ceiling, they divide it: use cosAssertSomeDisclosureObserved() to make a
// run that still ran out fail loudly instead of going quiet.
function cosOriginPools() {
  const info = get_host_info();
  const port2 = info.HTTPS_PORT2;
  const hostOf = (origin) => new URL(origin).hostname;
  return {
    // Distinct origins that are all same-site with this document's origin.
    sameSite: [
      info.HTTPS_REMOTE_ORIGIN,
      info.AUTHENTICATED_ORIGIN,
      `https://${info.ORIGINAL_HOST}:${port2}`,
      `https://${info.REMOTE_HOST}:${port2}`,
      `https://${hostOf(info.AUTHENTICATED_ORIGIN)}:${port2}`,
    ],
    // Distinct origins that are all cross-site with this document's origin.
    crossSite: [
      info.HTTPS_NOTSAMESITE_ORIGIN,
      info.HTTPS_OTHER_NOTSAMESITE_ORIGIN,
      `https://${info.NOTSAMESITE_HOST}:${port2}`,
      `https://${hostOf(info.HTTPS_OTHER_NOTSAMESITE_ORIGIN)}:${port2}`,
    ],
  };
}

// Each test file starts at a different point in the pools, so that files do
// not all pile onto the first entry the way a plain zero-based cursor would.
function cosPoolSeed() {
  let h = 0;
  for (const c of self.location.pathname) {
    h = (h * 31 + c.charCodeAt(0)) | 0;
  }
  return Math.abs(h);
}

const cosPools_ = cosOriginPools();
let cosSameSiteCursor_ = cosPoolSeed();
let cosCrossSiteCursor_ = cosPoolSeed();

// Returns a distinct origin that is same-site with this document, rotating
// through the pool so that no single origin absorbs the whole file's probes.
function cosNextSameSiteOrigin() {
  const pool = cosPools_.sameSite;
  return pool[cosSameSiteCursor_++ % pool.length];
}

// As above, for origins that are cross-site with this document.
function cosNextCrossSiteOrigin() {
  const pool = cosPools_.crossSite;
  return pool[cosCrossSiteCursor_++ % pool.length];
}

// Tally of what cosAssertDisclosableOrGreased() actually saw, so that a file
// whose authorized reads were *all* refused can say so instead of passing
// vacuously.
const cosDisclosureTally = {authorized: 0, disclosed: 0};

// Fails if a file made authorized cross-origin reads and not one of them was
// ever disclosed. GREASE'ing is probabilistic and the probe budget is finite,
// so any single refusal is expected; every one of them being refused means the
// file exercised none of the disclosure path it exists to test.
function cosAssertSomeDisclosureObserved() {
  assert_greater_than(cosDisclosureTally.authorized, 0,
    'this check belongs only in files that make authorized cross-origin reads');
  assert_greater_than(cosDisclosureTally.disclosed, 0,
    `all ${cosDisclosureTally.authorized} authorized cross-origin reads in this file were ` +
    `refused, so none of them tested disclosure. Expected causes: GREASE'ing set so high that ` +
    `the feature is never useful, an empty Public Hash List, or a cross-origin probe budget too ` +
    `small for this suite (see the pools above)`);
}

// Asserts that a read is authorized by COS entry/origins scoping (the
// requesting origin is in scope) but tolerates the two mechanisms that may
// suppress even an authorized disclosure: GREASE'ing
// (https://wicg.github.io/cross-origin-storage/#greasing), and the requesting
// origin being over its cross-origin probe budget
// (https://wicg.github.io/cross-origin-storage/#cross-site-identifiers).
// Neither ever *grants* disclosure that scoping would otherwise deny, and both
// refuse with the same NotFoundError as an out-of-scope read, so this is only
// ever used for reads that the spec says *should* be authorized.
//
// Note that a cross-origin read in a test is charged against the *remote*
// origin's budget, which an iframe the user never interacts with does not
// replenish -- so a suite that spends many distinct hashes against one remote
// origin makes these assertions progressively more vacuous rather than
// failing.
function cosAssertDisclosableOrGreased(result, expectedText, description) {
  cosDisclosureTally.authorized++;
  if (result.ok) {
    cosDisclosureTally.disclosed++;
    assert_equals(result.text, expectedText, `${description}: content`);
  } else {
    assert_equals(result.name, 'NotFoundError',
      `${description}: an unauthorized read always rejects with NotFoundError, ` +
      `so a rejection for an authorized read must still be NotFoundError ` +
      `(GREASE'd, or over the probe budget), got ${result.name}: ${result.message}`);
  }
}

// Asserts that a read is NOT authorized: this must deterministically reject
// with NotFoundError. Unlike the disclosable case, neither GREASE'ing nor the
// probe budget is the explanation here -- an out-of-scope origin is rejected
// before GREASE'ing is even considered (see "apply availability gating"), and
// a budget refusal uses the same NotFoundError, so the expected outcome is the
// same either way.
function cosAssertNotDisclosed(result, description) {
  assert_false(result.ok, `${description}: expected the read to be rejected`);
  assert_equals(result.name, 'NotFoundError', `${description}: got ${result.name}: ${result.message}`);
}

// Stores `content` under `hash` from inside a RemoteContext, so that the
// write is attributed to the remote context's origin (and governed by that
// context's response headers, e.g. a `Cross-Origin-Storage-Allow-Origin`
// ceiling applied via `pipeHeader`). `options` is passed through to
// requestFileHandle() with `create` forced to true. Shaped as {ok: true} or
// {ok: false, name, message}.
async function cosRemoteStore(ctx, hash, content, options = {}) {
  return ctx.execute_script(async (hash, content, options) => {
    try {
      const handle = await navigator.crossOriginStorage.requestFileHandle(
        hash, {...options, create: true});
      const writable = await handle.createWritable();
      await writable.write(new Blob([content]));
      await writable.close();
      return {ok: true};
    } catch (e) {
      return {ok: false, name: e.name, message: e.message};
    }
  }, [hash, content, options]);
}

// Builds a wptserve `pipe` directive that sets a `Cross-Origin-Storage-Allow-Origin`
// response header (the write-time ceiling of
// https://wicg.github.io/cross-origin-storage/#allow-origin-header) naming
// `origins` (a single origin string or an array of them). Pass the result as
// `pipeHeader` to cosOpenRemoteContext(). Commas between origins are
// backslash-escaped so wptserve's pipe parser keeps them inside the single
// header value, mirroring how the Permissions-Policy tests escape parens.
function cosAllowOriginPipe(origins) {
  const list = Array.isArray(origins) ? origins : [origins];
  return `header(Cross-Origin-Storage-Allow-Origin,${list.join('\\,')})`;
}
