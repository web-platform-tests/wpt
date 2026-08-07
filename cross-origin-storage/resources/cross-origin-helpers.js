// Cross-origin test infrastructure shared by COS's origin-scoping and
// cross-origin declarative-integration tests. Requires
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

// Asserts that a read is authorized by COS entry/origins scoping (the
// requesting origin is in scope) but tolerates the user agent electing to
// apply GREASE'ing (https://wicg.github.io/cross-origin-storage/#greasing),
// which may suppress even an authorized disclosure. GREASE'ing never
// *grants* disclosure that scoping would otherwise deny, so this is only
// ever used for reads that the spec says *should* be authorized.
function cosAssertDisclosableOrGreased(result, expectedText, description) {
  if (result.ok) {
    assert_equals(result.text, expectedText, `${description}: content`);
  } else {
    assert_equals(result.name, 'NotFoundError',
      `${description}: an unauthorized read always rejects with NotFoundError, ` +
      `so a rejection for an authorized read must still be NotFoundError (GREASE'd), got ${result.name}: ${result.message}`);
  }
}

// Asserts that a read is NOT authorized: this must deterministically reject
// with NotFoundError. Unlike the disclosable case, GREASE'ing is never the
// explanation here -- an out-of-scope origin is rejected before GREASE'ing
// is even considered (see "apply availability gating").
function cosAssertNotDisclosed(result, description) {
  assert_false(result.ok, `${description}: expected the read to be rejected`);
  assert_equals(result.name, 'NotFoundError', `${description}: got ${result.name}: ${result.message}`);
}
