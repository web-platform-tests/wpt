function expect_fetched_onload(uuid, expectation) {
  return new Promise((resolve, reject) => {
    addEventListener('load', async () => {
      const response = await fetch(`/html/syntax/preload-scanner.tentative/resources/stash.py?action=take&uuid=${uuid}`);
      const result = await response.text();
      if (expectation) {
        assert_equals(result, 'fetched', 'expected the preload scanner to prefetch');
      } else {
        assert_equals(result, '', 'expected the preload scanner to NOT prefetch');
      }
      resolve();
    });
  });
}
