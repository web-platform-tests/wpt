// Helpers called on the main test HTMLs.
// Scripts in `send()` arguments are evaluated on the executors
// (`executor.html`), and helpers available on the executors are defined in
// `executor.html`.

const idThis = token();

const originSameOrigin =
  location.protocol === 'http:' ?
  'http://{{host}}:{{ports[http][0]}}' :
  'https://{{host}}:{{ports[https][0]}}';
const originSameSite =
  location.protocol === 'http:' ?
  'http://{{host}}:{{ports[http][1]}}' :
  'https://{{host}}:{{ports[https][1]}}';
const originCrossSite =
  location.protocol === 'http:' ?
  'http://{{hosts[alt][www]}}:{{ports[http][0]}}' :
  'https://{{hosts[alt][www]}}:{{ports[https][0]}}';

const executorPath =
  '/html/browsers/browsing-the-web/back-forward-cache/resources/executor.html?uuid=';
const backPath =
  '/html/browsers/browsing-the-web/back-forward-cache/resources/back.html';

// On the executor with uuid `idTarget`: Evaluates the script `expr`, and
// On the caller: returns a Promise resolved with the result of `expr`.
// This assumes the result can be serialized by JSON.stringify().
async function evalOn(idTarget, expr) {
  await send(idTarget, `await send('${idThis}', JSON.stringify(${expr}));`);
  const result = await receive(idThis);
  return JSON.parse(result);
}

// On the executor with uuid `idTarget`:
//   Evaluates `script` that returns a Promise resolved with `result`.
// On the caller:
//   Returns a Promise resolved with `result`
//   (or 'Error' when the promise is rejected).
// This assumes `result` can be serialized by JSON.stringify().
async function asyncEvalOn(idTarget, script) {
  send(idTarget, `
    try {
      const result = await async function() { ${script} }();
      await send('${idThis}', JSON.stringify(result));
    }
    catch (error) {
      await send('${idThis}', '"Error"');
    }`);
  const result = await receive(idThis);
  return JSON.parse(result);
}

async function runEligibilityCheck(script) {
  const idA = token();
  window.open(executorPath + idA, '_blank', 'noopener');
  await send(idA, script);
  await send(idA, `
      prepareNavigation();
      location.href = '${originCrossSite + backPath}';
  `);
  await assert_bfcached(idA);
}

async function getBFCachedStatus(idTarget) {
  const [loadCount, isPageshowFired] =
    await evalOn(idTarget, '[window.loadCount, window.isPageshowFired]');
  if (loadCount === 1 && isPageshowFired === true) {
    return 'BFCached';
  } else if (loadCount === 2 && isPageshowFired === false) {
    return 'Not BFCached';
  } else {
    // This can occur for example when this is called before first navigating
    // away (loadCount = 1, isPageshowFired = false), e.g. when
    // 1. sending a script for navigation and then
    // 2. calling getBFCachedStatus() without waiting for the completion of
    //    the script on the `idTarget` page.
    assert_unreached(
      `Got unexpected BFCache status: loadCount = ${loadCount}, ` +
      `isPageshowFired = ${isPageshowFired}`);
  }
}

// Asserts that the executor with uuid `idTarget` is (or isn't, respectively)
// restored from BFCache.
// These should be used with prepareNavigation() (see `../README.md`).
async function assert_bfcached(idTarget) {
  const status = await getBFCachedStatus(idTarget);
  assert_implements_optional(status === 'BFCached', 'Should be BFCached');
}
async function assert_not_bfcached(idTarget) {
  const status = await getBFCachedStatus(idTarget);
  assert_implements_optional(status !== 'BFCached', 'Should not be BFCached');
}
