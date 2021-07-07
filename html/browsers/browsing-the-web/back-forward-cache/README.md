# Dispatcher/executor framework

In the BFCache tests, the main test HTML

1. Opens new executor Windows using `window.open()` + `noopener` option, and
2. Injects scripts to / receives values from the executor Windows via send()/receive() methods provided by
   [the dispatcher/executor framework of COEP credentialless](../../../cross-origin-embedder-policy/credentialless/README.md)

because less isolated Windows (e.g. iframes and `window.open()` without `noopener` option) are often not eligible for BFCache (e.g. in Chromium).

# BFCache-specific helpers

- [resources/executor.html](resources/executor.html) is the BFCache-specific executor and contains helpers for executors.
- [resources/helper.sub.js](resources/helper.sub.js) contains helpers for main test HTMLs.

In typical A-B-A scenarios (where we navigate from Page A to Page B and then navigate back to Page A, assuming Page A is (or isn't) in BFCache),

- Call `prepareNavigation()` on the executor, and then navigate to B, and then navigate back to Page A.
- Call `assert_bfcached()` or `assert_not_bfcached()` on the main test HTML, to check the BFCache status.
- Check other test expectations on the main test HTML.

Note that

- `await`ing `send()` calls (and other wrapper methods) is needed to serialize injected scripts.
- `send()`/`receive()` uses Fetch API + server-side stash.
  `prepareNavigation()` suspends Fetch API calls until we navigate back to the page, to avoid conflicts with BFCache eligibility.

# Asserting PRECONDITION_FAILED for unexpected BFCache eligibility

To distinguish failures due to unexpected BFCache eligibility (which might be acceptable due to different BFCache eligibility criteria across browsers),
`assert_bfcached()` and `assert_not_bfcached()` asserts `PRECONDITION_FAILED` rather than ordinal failures.
