// Cross-origin test infrastructure shared by COS's origin-scoping and
// cross-origin declarative/import-attribute integration tests. Requires
// /common/dispatcher/dispatcher.js and /common/utils.js to already be
// loaded.

// Creates a hidden iframe pointed at the remote executor page on `origin`,
// with `cross-origin-storage` explicitly allowed via the iframe's `allow`
// attribute (shorthand for "cross-origin-storage 'src'"), and returns a
// RemoteContext for running script inside it. `pipeHeader`, if given, is a
// wptserve pipe `header(...)` (or `|`-joined multiple headers) directive
// applied to the executor response itself, e.g. to set an explicit
// Permissions-Policy or Cross-Origin-Storage-Allow-Origin header.
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

// Runs `navigator.crossOriginStorage.getFileHandle(hash)` inside a
// RemoteContext and returns a plain, serializable descriptor, since only a
// TypeError keeps its name across the RemoteContext boundary (everything else
// arrives as a generic Error). Shaped as either {ok: true, text} or
// {ok: false, name, message}.
async function cosRemoteRead(ctx, hash) {
  return ctx.execute_script(async (hash) => {
    try {
      const handle = await navigator.crossOriginStorage.getFileHandle(hash);
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
      const handle = await navigator.crossOriginStorage.getFileHandle(hash);
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

// Pools of distinct origins, one per site relationship the tests depend on.
// Rotating through them keeps each test's reader and writer origins apart, so
// that a test does not pass only because an earlier test in the same file
// already stored or read through the same origin.
//
// A user agent may also bound cross-site lookups for the "*" grant, for
// example with a small budget of lookups keyed on the top-level site and
// shared by every frame on the page, which persists across reloads for a time
// window (https://wicg.github.io/cross-origin-storage/#availability-gating).
// Such a budget is a non-normative example mitigation. It only ever applies to
// reads that qualify through the global grant alone, and since it is keyed on
// the test page's top-level site, the pools do not divide it.
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
// through the pool.
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
// whose global-grant reads were *all* refused fails, and does not pass
// vacuously.
const cosDisclosureTally = {authorized: 0, disclosed: 0};

// Fails if a file made global-grant reads of a Public Hash List resource and
// not one of them was disclosed. GREASE'ing is probabilistic and a cross-site
// lookup budget is finite, so any single refusal is expected; every one of
// them being refused means the file exercised none of the disclosure path it
// exists to test.
function cosAssertSomeDisclosureObserved() {
  assert_greater_than(cosDisclosureTally.authorized, 0,
    'this check belongs only in files that make global-grant reads');
  assert_greater_than(cosDisclosureTally.disclosed, 0,
    `all ${cosDisclosureTally.authorized} global-grant reads in this file were refused, so ` +
    `none of them tested disclosure. Expected causes: GREASE'ing set so high that the feature ` +
    `is never useful, the resource missing from the Public Hash List, or a cross-site lookup ` +
    `budget too small for this suite`);
}

// Asserts that a read is disclosed. Use this for every reader that qualifies
// through the storing origins, the explicit origins list, or the same-site set
// of either: "determine COS disclosure" returns the entry for those before it
// reaches the Public Hash List gate or GREASE'ing, and a user agent must not
// GREASE them (https://wicg.github.io/cross-origin-storage/#greaseing).
function cosAssertDisclosed(result, expectedText, description) {
  assert_true(result.ok,
    `${description}: expected the read to be disclosed, got ${result.name}: ${result.message}`);
  assert_equals(result.text, expectedText, `${description}: content`);
}

// As cosAssertDisclosed(), for a result from cosRemoteReadDigest().
function cosAssertDisclosedDigest(result, expectedDigest, description) {
  assert_true(result.ok,
    `${description}: expected the read to be disclosed, got ${result.name}: ${result.message}`);
  assert_equals(result.digest, expectedDigest, `${description}: digest`);
}

// Asserts the outcome of a read that qualifies through the global ("*")
// grant alone, for a resource on the Public Hash List. Only this case may be
// refused for an authorized reader: the user agent may GREASE it
// (https://wicg.github.io/cross-origin-storage/#greaseing) or refuse it once a
// cross-site lookup budget is spent
// (https://wicg.github.io/cross-origin-storage/#availability-gating). Both
// refuse with the same NotFoundError as an out-of-scope read. Never use this
// for storing, listed, or same-site readers; use cosAssertDisclosed() there.
function cosAssertDisclosableOrGreased(result, expectedText, description) {
  cosDisclosureTally.authorized++;
  if (result.ok) {
    cosDisclosureTally.disclosed++;
    assert_equals(result.text, expectedText, `${description}: content`);
  } else {
    assert_equals(result.name, 'NotFoundError',
      `${description}: a refused global-grant read must still reject with NotFoundError ` +
      `(GREASE'd, or over a cross-site lookup budget), got ${result.name}: ${result.message}`);
  }
}

// Asserts that a read is NOT authorized: this must deterministically reject
// with NotFoundError. An out-of-scope origin is refused by "determine COS
// disclosure" itself, and so is a global-grant reader of a hash that is not on
// the Public Hash List.
function cosAssertNotDisclosed(result, description) {
  assert_false(result.ok, `${description}: expected the read to be rejected`);
  assert_equals(result.name, 'NotFoundError', `${description}: got ${result.name}: ${result.message}`);
}

// Stores `content` under `hash` from inside a RemoteContext, so that the
// write is attributed to the remote context's origin (and governed by that
// context's response headers, e.g. a `Cross-Origin-Storage-Allow-Origin`
// ceiling applied via `pipeHeader`). `options` is passed through to
// getFileHandle() with `create` forced to true. Shaped as {ok: true} or
// {ok: false, name, message}.
async function cosRemoteStore(ctx, hash, content, options = {}) {
  return ctx.execute_script(async (hash, content, options) => {
    try {
      const handle = await navigator.crossOriginStorage.getFileHandle(
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
