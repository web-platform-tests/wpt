// META: global=window,worker
// META: script=/resource-timing/resources/resource-loaders.js

let url = new URL(
  '/resource-timing/resources/cacheable-and-validated.py' +
  '?content=somecontent',
  location.href).href;

const accumulateEntries = () => {
  return new Promise(resolve => {
    const po = new PerformanceObserver(list => {
      resolve(list);
    });
    po.observe({type: "resource", buffered: true});
  });
};

const checkDeliveryType = list => {
  const entries = list.getEntriesByName(url);
  assert_equals(entries.length, 3, 'Wrong number of entries');
  let seenCount = 0;
  for (let entry of entries) {
    if (seenCount === 0) {
      // 200 response (`cacheMode` is an empty string)
      assert_equals(entry.deliveryType, "",
        "Expect empty deliveryType for 200 response.");
    } else if (seenCount === 1 || seenCount === 2) {
      // Cached response (`cacheMode` is "local") or 304 response (`cacheMode`
      // is "validated").
      assert_equals(entry.deliveryType, "cache",
        "Expect 'cache' deliveryType for cached or 304 response.");
    } else {
      assert_unreached('Too many matching entries');
    }
    ++seenCount;
  }
};

// TODO(crbug/1358591): Rename this file from "tentative" once
// `w3c/resource-timing#343` is merged.
promise_test(() => {
  // Use a different URL every time so that the cache behaviour does not
  // depend on execution order.
  url = load.cache_bust(url);
  const eatBody = response => response.arrayBuffer();
  const mustRevalidate = {headers: {'Cache-Control': 'max-age=0'}};
  return fetch(url)
    .then(eatBody)
    .then(() => fetch(url))
    .then(eatBody)
    .then(() => fetch(url, mustRevalidate))
    .then(eatBody)
    .then(accumulateEntries)
    .then(checkDeliveryType);
}, 'PerformanceResourceTiming deliveryType test');

