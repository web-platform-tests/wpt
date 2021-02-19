/** @type {[name: string, url: string][]} */
const importUrlTests = [
  ["Module URL", "./resources/basic-module.js"],
  // In no-dynamic-import-in-module.any.js, this module is also statically imported
  ["Another module URL", "./resources/basic-module-2.js"],
  [
    "Module data: URL",
    "data:text/javascript;charset=utf-8," +
      encodeURIComponent(`export default 'hello!';`),
  ],
];

for (const [name, url] of importUrlTests) {
  promise_test(async () => {
    try {
      await import(url);
      assert_unreached("Import must not fulfill");
    } catch (err) {
      assert_equals(err.constructor, TypeError, "TypeError thrown");
    }
  }, name);
}
