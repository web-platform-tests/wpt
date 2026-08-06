// META: spec=https://w3c.github.io/payment-method-manifest/#ingest
// META: title=Basic Payment Method Manifest fetch and parsing end-to-end success
// META: script=/common/utils.js
// META: script=/payment-method-manifest/resources/helpers.js

promise_test(async t => {
  const testId = token();
  const pmiUrl = new URL(`resources/manifest-server.py?id=${testId}&step=pmi`, location.href).href;

  const request = new PaymentRequest(
    [{ supportedMethods: pmiUrl }],
    { total: { label: 'Total', amount: { currency: 'USD', value: '1.00' } } }
  );

  // Trigger PMM ingestion pipeline
  try {
    await request.canMakePayment();
  } catch (err) {
    // Failure here is expected if no JIT handler is installed,
    // but server fetches are still performed and verified below.
  }

  // Retrieve recorded server access logs for this test run
  const logs = await waitForServerAccessLogs(t, testId);

  assert_true(logs.length >= 2, 'Browser must issue at least 2 server requests (HEAD for PMI, GET for Manifest)');
  assert_equals(logs[0].step, 'pmi', 'First request must hit PMI URL');
  assert_equals(logs[0].method, 'HEAD', 'PMI request must use HEAD method');

  assert_equals(logs[1].step, 'manifest', 'Second request must hit manifest URL');
  assert_equals(logs[1].method, 'GET', 'Manifest request must use GET method');
  assert_equals(logs[1].headers['referer'], pmiUrl, 'Manifest referrer must match PMI response URL');
}, 'Basic Payment Method Manifest fetch and parsing end-to-end success');
