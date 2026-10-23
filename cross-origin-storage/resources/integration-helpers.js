// Shared helpers for the Cross-Origin Storage (COS) host integration tests
// (fetch/, html/, css/, import-attribute/, cross-mechanism-interop). Requires
// resources/helpers.js to already be loaded.
//
// https://wicg.github.io/cross-origin-storage/#storing-fetched-resources

// Absolute so that it resolves the same way from every directory and worker.
const COS_RESOURCE_URL =
  new URL('/cross-origin-storage/resources/cos-resource.py', self.location.href).href;

// Adds the `allow` query parameter that makes cos-resource.py send a
// `Cross-Origin-Storage-Allow-Origin` header. `allow` is a single header value
// or an array of origins, which are comma-separated as the header requires
// (https://wicg.github.io/cross-origin-storage/#allow-origin-header).
function cosAddAllow_(params, allow) {
  if (allow !== undefined) {
    params.set('allow', Array.isArray(allow) ? allow.join(', ') : allow);
  }
}

// A same-origin URL that serves exactly `content` as `type`, optionally with a
// `Cross-Origin-Storage-Allow-Origin` response header. The integrations read
// a list-form scope ceiling from the fetched resource's own response, so this
// is how a test authorizes listed origins for a host integration write.
function cosResourceUrl(content, type = 'text/plain', {allow} = {}) {
  const params = new URLSearchParams({content, type});
  cosAddAllow_(params, allow);
  return `${COS_RESOURCE_URL}?${params}`;
}

// A same-origin URL that serves a copy of Ahem with unique trailing bytes, so
// that its hash is one nothing has stored before. Fetch the URL to learn the
// bytes (see `cosIntegrityOfUrl()`).
function cosUniqueFontUrl(label, {allow} = {}) {
  const params = new URLSearchParams({kind: 'font', token: cosUniqueContent(label)});
  cosAddAllow_(params, allow);
  return `${COS_RESOURCE_URL}?${params}`;
}

// A same-origin URL that serves a copy of /css/support/60x60-green.png with
// unique trailing bytes, so that its hash is one nothing has stored before.
function cosUniqueImageUrl(label, {allow} = {}) {
  const params = new URLSearchParams({kind: 'image', token: cosUniqueContent(label)});
  cosAddAllow_(params, allow);
  return `${COS_RESOURCE_URL}?${params}`;
}

// Fetches `url` without COS and returns the Subresource Integrity string and
// the COS hash of its bytes.
async function cosIntegrityOfUrl(url) {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  return {
    integrity: await cosSha256Integrity(bytes),
    hash: cosHash(await cosSha256Hex(bytes)),
    bytes,
  };
}

// A same-origin URL that reliably 404s, so that a load that succeeds against it
// can only have been served from COS. Resolved against this context's own
// location, which avoids a slow or hanging DNS lookup for an invented host.
function cosBrokenUrl(extension = 'txt') {
  return new URL(`./does-not-exist-${Math.random()}.${extension}`, self.location.href).href;
}

// Rejects with NotFoundError if `hash` is not readable by this origin. Used
// after a write that the spec says must not store anything: this origin would
// be a storing origin of any entry it wrote, so a stored entry would be read.
async function cosAssertNotStored(t, hash, description) {
  await promise_rejects_dom(t, 'NotFoundError',
    navigator.crossOriginStorage.getFileHandle(hash), description);
}

// Resolves true when `family` loaded through at least one @font-face. Both
// `document.fonts.check()` and an empty `document.fonts.load()` result report
// success for a face that failed or a `src` the parser dropped, so this checks
// each face's status.
async function cosFontLoaded(family) {
  let faces;
  try {
    faces = await document.fonts.load(`16px "${family}"`);
  } catch (e) {
    return false;
  }
  return faces.length > 0 && faces.every((face) => face.status === 'loaded');
}

// A per-run unique stylesheet that colors `#${id}` rgb(1, 2, 3).
function cosUniqueStylesheet(label, id) {
  return `#${id} { color: rgb(1, 2, 3); }\n/* ${cosUniqueContent(label)} */\n`;
}

// A per-run unique module whose default export is `value`.
function cosUniqueModule(label, value) {
  return `export default ${JSON.stringify(value)};\n// ${cosUniqueContent(label)}\n`;
}
