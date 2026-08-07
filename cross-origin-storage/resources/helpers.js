// Shared helpers for Cross-Origin Storage (COS) tests.
// https://wicg.github.io/cross-origin-storage/

// Hex-encodes the SHA-256 digest of `data`, which may be a string, a
// BufferSource, or a Blob.
async function cosSha256Hex(data) {
  let bytes;
  if (typeof data === 'string') {
    bytes = new TextEncoder().encode(data);
  } else if (data instanceof Blob) {
    bytes = new Uint8Array(await data.arrayBuffer());
  } else {
    bytes = data;
  }
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function cosHash(value, algorithm = 'SHA-256') {
  return {algorithm, value};
}

// Computes a Subresource Integrity string (base64-encoded digest, e.g.
// "sha256-abc...") for `content`, as used by the `integrity` attribute /
// `integrity()` CSS modifier / import-attribute `integrity` key -- the
// declarative integrations' hash format, distinct from requestFileHandle()'s
// lowercase-hex format (both identify the same underlying bytes).
async function cosSha256Integrity(content) {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return `sha256-${base64}`;
}

// Generates unique text content for a test, so that concurrently-running
// tests (and re-runs against a persistent implementation) never collide on
// the same hash.
function cosUniqueContent(label) {
  return `cos-test-${label}-${self.location.href}-${Date.now()}-${Math.random()}`;
}

// A hash value that is syntactically valid but, with overwhelming
// probability, was never stored by anything.
function cosMissingHash() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const value = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return cosHash(value);
}

// Stores `content` (a string) under its own SHA-256 hash and returns
// {hash, content, handle}. `options` is passed through to
// requestFileHandle() with `create` forced to true.
async function cosStore(content, options = {}) {
  const value = await cosSha256Hex(content);
  const hash = cosHash(value);
  const handle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {...options, create: true});
  const writable = await handle.createWritable();
  await writable.write(new Blob([content], {type: 'text/plain'}));
  await writable.close();
  return {hash, content, handle};
}

// Reads back a resource previously stored via requestFileHandle() and
// returns its text content.
async function cosReadText(hash) {
  const handle = await navigator.crossOriginStorage.requestFileHandle(hash);
  const file = await handle.getFile();
  return file.text();
}
