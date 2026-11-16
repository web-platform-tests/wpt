const granted = 'storage';
const notGranted = 'cookies';

browser.test.runTests([
  /**
   * Tests `browser.permissions.getAll`.
   */
  async function testPermissionsGetAll() {
    const all = await browser.permissions.getAll();
    browser.test.assertTrue(Array.isArray(all.permissions),
                            'permissions should be an array');
    browser.test.assertTrue(all.permissions.includes(granted),
                            `permissions should include '${granted}'`);
    browser.test.assertFalse(all.permissions.includes(notGranted),
                             `permissions should not include '${notGranted}'`);
  },

  /**
   * Tests `browser.permissions.contains`.
   */
  async function testPermissionsContains() {
    const hasGranted =
        await browser.permissions.contains({permissions: [granted]});
    browser.test.assertTrue(hasGranted,
                            'contains should be true for a granted permission');
    const hasNotGranted =
        await browser.permissions.contains({permissions: [notGranted]});
    browser.test.assertFalse(
        hasNotGranted,
        'contains should be false for a permission that is not granted');
  },

  /**
   * Tests `browser.permissions.contains` error cases.
   */
  function testPermissionsErrorCases() {
    // Verify `contains` throws on invalid arguments (requires `object`).
    browser.test.assertThrows(() => browser.permissions.contains('invalid'));
  }
]);
