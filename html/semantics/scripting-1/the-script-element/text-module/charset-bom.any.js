// META: global=window,dedicatedworker,sharedworker
// META: script=/common/utils.js

promise_test(async () => {
    const jsonModule = await import('./bom-utf-8.txt', { with: { type: 'text' } });
    assert_equals(jsonModule.default, 'hello');
}, 'UTF-8 BOM should be stripped when decoding text module script');

promise_test(async test => {
    await promise_rejects_js(test, SyntaxError,
        import('./bom-utf-16be.txt', { with: { type: 'text' } }), 'Expected parse error from UTF-16BE BOM');
}, 'UTF-16BE BOM should result in parse error in text module script');

promise_test(async test => {
    await promise_rejects_js(test, SyntaxError,
        import('./bom-utf-16le.txt', { with: { type: 'text' } }), 'Expected parse error from UTF-16LE BOM');
}, 'UTF-16LE BOM should result in parse error in text module script');
