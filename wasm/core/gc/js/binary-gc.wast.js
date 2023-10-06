(function binary_gc_wast_js() {

// binary-gc.wast:1
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x05\x01\x5e\x78\x02");
reinitializeRegistry();
})();
