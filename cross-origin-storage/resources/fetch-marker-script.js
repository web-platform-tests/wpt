// Used only by the fetch() integration's cross-mechanism interop test, which
// needs a classic script whose hash no other test in the suite ever stores.
// Sharing marker-script.js would let that test pass on an entry another test
// wrote, proving nothing about the integration under test.
window.__cosFetchScriptRunCount = (window.__cosFetchScriptRunCount || 0) + 1;
