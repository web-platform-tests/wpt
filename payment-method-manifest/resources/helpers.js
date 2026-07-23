/**
 * Waits for and retrieves server access logs recorded by manifest-server.py for a given test ID.
 *
 * Since manifest fetching and ingesting is asynchronous, this method allows for
 * a desired count of events to be observed before it will return them. Until it
 * reaches that count, it will retry the call up to `maxRetries` times, waiting
 * `delayMs` between each call. If it never reaches the required number of
 * events, it will throw an Error.
 *
 * @param {Object} t - The testharness test instance (providing t.step_wait).
 * @param {string} testId - The unique test run token.
 * @param {number} requiredCount - Required number of events (default 2: HEAD for PMI, GET for payment method manifest).
 * @param {number} maxRetries - Maximum polling attempts (default 30).
 * @param {number} delayMs - Delay between polling attempts in milliseconds (default 100ms).
 * @returns {Promise<Array>} Array of logged request objects.
 */
async function waitForServerAccessLogs(t, testId, requiredCount = 2, maxRetries = 30, delayMs = 100) {
  const queryUrl = `/payment-method-manifest/resources/stash-query.py?id=${testId}`;
  let lastLogs = [];

  await t.step_wait(
    async () => {
      const resp = await fetch(queryUrl);
      if (!resp.ok) {
        throw new Error(
          `stash-query.py failed with HTTP status ${resp.status} for test ID '${testId}'`
        );
      }
      lastLogs = await resp.json();
      return lastLogs && lastLogs.length >= requiredCount;
    },
    `Waiting for ${requiredCount} server access logs for test ID '${testId}'`,
    maxRetries * delayMs,
    delayMs
  );

  return lastLogs;
}
